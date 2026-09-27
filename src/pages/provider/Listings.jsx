import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Edit2, Archive, Eye, ToggleLeft, ToggleRight, Check,
  ShieldAlert, CheckCircle2, MapPin, Calendar, Clock, DollarSign,
  ExternalLink, ArrowLeft, ArrowRight, Package
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  fetchProviderListings,
  saveProviderListing,
  updateListingStatus,
  archiveListing,
  updateListingAvailability
} from '@/lib/listingsService'

const TABS = [
  { id: 'all',      label: 'All Listings' },
  { id: 'active',   label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'archived', label: 'Archived' },
]

const WIZARD_STEPS = ['Type & Category', 'Details & Photos', 'Pricing', 'Location', 'Availability', 'Review & Publish']

const tomorrowDateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]
const sixMonthsDateStr = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]

const INITIAL_FORM = {
  type: '',
  category: '',
  title: '',
  description: '',
  price: '0',
  unit: 'per session',
  minDuration: '1',
  maxDuration: '10',
  location: '',
  serviceArea: '',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  hoursFrom: '08:00',
  hoursTo: '17:00',
  availableFrom: tomorrowDateStr,
  availableTo: sixMonthsDateStr,
  ongoingAvailability: true,
}

export default function ProviderListings() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const [tab, setTab]               = useState('all')
  const [page, setPage]             = useState(1)
  const [showAdd, setShowAdd]       = useState(false)
  const [showKycModal, setShowKycModal] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [viewingListing, setViewingListing] = useState(null)
  const [editingAvailability, setEditingAvailability] = useState(null)
  const [availForm, setAvailForm] = useState({
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    hoursFrom: '08:00',
    hoursTo: '17:00',
    availableFrom: tomorrowDateStr,
    availableTo: sixMonthsDateStr,
    ongoingAvailability: true,
  })
  // Listings are scoped per-user so new providers always start fresh
  const [listings, setListings]     = useState([])

  // Load listings from local cache immediately, then sync from Supabase backend
  useEffect(() => {
    if (!user?.id) return
    let isMounted = true

    // ── Helper: compute live booking counts from all booking stores ──
    const getLiveBookingCounts = () => {
      const counts = {} // listingId or serviceTitle -> count
      try {
        // 1. From dedicated per-listing counter keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('serviceq_listing_bookings_')) {
            const lid = key.replace('serviceq_listing_bookings_', '')
            counts[lid] = Number(localStorage.getItem(key) || 0)
          }
        }
        // 2. From all bookings stores — count by listingId and title
        const allBk = JSON.parse(localStorage.getItem('serviceq_all_bookings')) || []
        const custBk = JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || []
        const provBk = JSON.parse(localStorage.getItem(`serviceq_provider_bookings_${user.id}`)) || []
        const genBk = JSON.parse(localStorage.getItem('serviceq_provider_bookings')) || []

        const seen = new Set()
        for (const b of [...allBk, ...custBk, ...provBk, ...genBk]) {
          if (b && b.id && !seen.has(b.id)) {
            seen.add(b.id)
            if (b.listingId) {
              counts[String(b.listingId)] = (counts[String(b.listingId)] || 0) + 1
            }
            if (b.service) {
              counts[b.service] = (counts[b.service] || 0) + 1
            }
          }
        }
      } catch {}
      return counts
    }

    const applyBookingCounts = (items) => {
      const counts = getLiveBookingCounts()
      return items.map(l => {
        const calculated = Math.max(
          Number(l.bookings) || 0,
          counts[String(l.id)] || 0,
          counts[l.title] || 0
        )
        return {
          ...l,
          bookings: calculated,
        }
      })
    }

    // 1. Instant local read
    try {
      const stored = JSON.parse(localStorage.getItem(`serviceq_provider_listings_${user.id}`))
      if (Array.isArray(stored) && stored.length > 0) {
        setListings(applyBookingCounts(stored))
      }
    } catch {}

    // 2. Live backend fetch
    const syncFromBackend = () => {
      fetchProviderListings(user.id).then(live => {
        if (isMounted && Array.isArray(live) && live.length > 0) {
          setListings(applyBookingCounts(live))
        }
      }).catch(err => console.warn('Could not load live provider listings:', err))
    }

    syncFromBackend()

    // 3. Re-apply counts when a new booking arrives
    const handleBookingUpdate = () => {
      setListings(prev => applyBookingCounts(prev))
      syncFromBackend()
    }
    window.addEventListener('serviceq_bookings_updated', handleBookingUpdate)
    window.addEventListener('serviceq_listings_updated', handleBookingUpdate)
    window.addEventListener('storage', handleBookingUpdate)

    // 4. Cross-tab BroadcastChannel listener
    let bc = null
    try {
      bc = new BroadcastChannel('serviceq_bookings')
      bc.onmessage = handleBookingUpdate
    } catch {}

    // 5. Polling every 4 seconds for cross-browser / incognito updates
    const poll = setInterval(handleBookingUpdate, 4000)

    return () => {
      isMounted = false
      clearInterval(poll)
      window.removeEventListener('serviceq_bookings_updated', handleBookingUpdate)
      window.removeEventListener('serviceq_listings_updated', handleBookingUpdate)
      window.removeEventListener('storage', handleBookingUpdate)
      if (bc) bc.close()
    }
  }, [user?.id])

  // Wizard form state
  const [form, setForm] = useState(INITIAL_FORM)

  const handleOpenAdd = () => {
    setForm(INITIAL_FORM)
    setShowAdd(true)
    setWizardStep(0)
  }

  const openEditAvailability = (listing) => {
    setEditingAvailability(listing)
    setAvailForm({
      days: Array.isArray(listing.days) && listing.days.length > 0 ? listing.days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hoursFrom: listing.hoursFrom || '08:00',
      hoursTo: listing.hoursTo || '17:00',
      availableFrom: listing.availableFrom || tomorrowDateStr,
      availableTo: listing.availableTo || sixMonthsDateStr,
      ongoingAvailability: listing.ongoingAvailability ?? !listing.availableTo,
    })
  }

  const saveAvailability = async () => {
    if (!editingAvailability) return

    const availData = {
      days: availForm.days,
      hoursFrom: availForm.hoursFrom,
      hoursTo: availForm.hoursTo,
      availableFrom: availForm.availableFrom,
      availableTo: availForm.ongoingAvailability ? null : availForm.availableTo,
      ongoingAvailability: availForm.ongoingAvailability,
    }

    setListings(prev => prev.map(l => l.id === editingAvailability.id ? {
      ...l,
      ...availData,
    } : l))

    if (viewingListing && viewingListing.id === editingAvailability.id) {
      setViewingListing(v => ({
        ...v,
        ...availData,
      }))
    }

    await updateListingAvailability(editingAvailability.id, availData, user?.id)

    toast.success('Listing availability updated and synced!')
    setEditingAvailability(null)
  }

  // Slide 26: Listen for ?action=add from dashboard
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      handleOpenAdd()
      searchParams.delete('action')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams])

  const PAGE_SIZE = 4
  const isDefaultAll = tab === 'all'

  const visible = listings.filter(l => tab === 'all' || l.status === tab)

  const displayed = isDefaultAll
    ? visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : visible

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setPage(1)
  }

  const toggleStatus = async (id) => {
    const current = listings.find(l => l.id === id)
    const newStatus = current?.status === 'active' ? 'inactive' : 'active'

    setListings(prev => prev.map(l =>
      l.id === id ? { ...l, status: newStatus } : l
    ))

    await updateListingStatus(id, newStatus, user?.id)
    toast.success(`Listing ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
  }

  const handleArchive = async (id) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'archived' } : l))
    await archiveListing(id, user?.id)
    toast.success('Listing archived and removed from customer explore')
  }

  const isStepValid = (step) => {
    switch (step) {
      case 0: return Boolean(form.type && form.category)
      case 1: return Boolean(form.title.trim() && form.description.trim())
      case 2: return Boolean(form.price && parseFloat(form.price) > 0)
      case 3: return Boolean(form.location.trim() && form.serviceArea.trim())
      case 4: return Boolean(form.days.length > 0 && form.hoursFrom && form.hoursTo)
      default: return true
    }
  }

  const handlePublish = async () => {
    if (!form.title.trim()) {
      return toast.error('Please provide a listing title')
    }

    const typeNormalized = (form.type || 'Service').toLowerCase().includes('rental') ? 'rentals' : 'services'
    const newListing = {
      id: String(Date.now()),
      title: form.title.trim(),
      type: typeNormalized,
      category: form.category || 'Services',
      subCategory: form.category || 'General',
      price: parseFloat(form.price) || 0,
      unit: form.unit || 'per session',
      status: 'active',
      bookings: 0,
      color: typeNormalized === 'rentals' ? 'from-emerald-400 to-teal-400' : 'from-blue-400 to-indigo-400',
      provider: profile?.full_name || user?.user_metadata?.full_name || 'Verified Provider',
      providerId: user?.id,
      distance: 1.0,
      rating: 5.0,
      reviews: 0,
      days: form.days && form.days.length > 0 ? form.days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hoursFrom: form.hoursFrom || '08:00',
      hoursTo: form.hoursTo || '17:00',
      availableFrom: form.availableFrom || null,
      availableTo: form.ongoingAvailability ? null : form.availableTo,
      ongoingAvailability: form.ongoingAvailability,
      location: form.location || profile?.city || 'Cebu City',
      serviceArea: form.serviceArea || 'Metro Cebu',
      description: form.description || form.title,
    }

    // Optimistic local state update
    setListings(prev => [newListing, ...prev.filter(l => l.id !== newListing.id)])

    // Persist to backend & local cache
    await saveProviderListing(newListing, user?.id)

    toast.success('New listing published and live for customers!')
    setShowAdd(false)
    setWizardStep(0)
    setForm(INITIAL_FORM)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your active offerings and services</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-primary gap-2"
          style={{ background: '#059669' }}
        >
          <Plus size={16} /> Add New Listing
        </button>
      </div>

      <Tabs tabs={TABS.map(t => ({ ...t, count: listings.filter(l => t.id === 'all' || l.status === t.id).length }))}
        active={tab} onChange={handleTabChange} />

      {visible.length === 0 ? (
        <div className="card py-16 text-center text-gray-400 border border-gray-200/80 shadow-sm flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Package size={28} />
          </div>
          <p className="font-bold text-gray-800 text-base">No listings found</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            {tab === 'all'
              ? 'You haven\'t published any listings yet. Click "Add New Listing" to create your first offering.'
              : `There are currently no listings in "${tab}" status.`}
          </p>
          {tab === 'all' && (
            <button
              onClick={handleOpenAdd}
              className="btn-primary text-xs mt-4 gap-1.5"
              style={{ background: '#059669' }}
            >
              <Plus size={14} /> Add New Listing
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-x-auto p-0 border border-gray-200/80 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                <th className="p-4 font-medium">Listing</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Bookings</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map(l => (
                <tr
                  key={l.id}
                  onClick={() => setViewingListing(l)}
                  className="hover:bg-emerald-50/40 cursor-pointer transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${l.color} flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                        ✓
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">{l.title}</div>
                        <div className="text-xs text-gray-400">{l.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 text-xs">{l.type}</td>
                  <td className="p-4 font-bold text-brand-600">{formatPHP(l.price)}<span className="text-xs text-gray-400 font-normal"> {l.unit}</span></td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      (l.bookings || 0) > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {l.bookings || 0}
                      <span className="font-normal text-[10px]">{(l.bookings || 0) === 1 ? 'booking' : 'bookings'}</span>
                    </span>
                  </td>
                  <td className="p-4"><Badge variant={statusVariant(l.status)} className="capitalize">{l.status}</Badge></td>
                  <td className="p-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingListing(l)}
                        title="View Details"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-emerald-700 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEditAvailability(l)}
                        title="Change Availability (Calendar & Schedule)"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <Calendar size={16} />
                      </button>
                      <button
                        onClick={() => toggleStatus(l.id)}
                        title={l.status === 'active' ? 'Disable Listing' : 'Activate Listing'}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      >
                        {l.status === 'active' ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
                      </button>
                      <button
                        onClick={() => handleArchive(l.id)}
                        title="Archive Listing"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Archive size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Conditional Pagination: only when tab === 'all' */}
          {isDefaultAll && visible.length > PAGE_SIZE && (
            <div className="p-4 border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalItems={visible.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Add Listing Wizard Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`Add New Listing – ${WIZARD_STEPS[wizardStep]}`} size="lg">
        {/* Step progress */}
        <div className="flex items-center gap-1 mb-6">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${i <= wizardStep ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Step 0: Type & Category */}
        {wizardStep === 0 && (
          <div className="flex flex-col gap-4">
            <label className="label">Offering Type *</label>
            <div className="grid grid-cols-3 gap-3">
              {['Service', 'Rental Property', 'Rental Item'].map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`p-3.5 border-2 rounded-xl text-xs font-semibold text-center transition-all ${
                    form.type === t ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="form-group mt-2">
              <label className="label">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="input"
              >
                <option value="">Select a category</option>
                <option value="Cleaning">Cleaning & Sanitation</option>
                <option value="Repairs">Repairs & Maintenance</option>
                <option value="Tutoring">Tutoring & Education</option>
                <option value="Events">Events & Production</option>
                <option value="Vehicles">Vehicles & Transport</option>
                <option value="Gadgets">Gadgets & Tech</option>
                <option value="Properties">Properties & Spaces</option>
                <option value="Catering">Catering & Food</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {wizardStep === 1 && (
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">Listing Title *</label>
              <input
                className="input"
                placeholder="e.g. Professional Sofa Shampooing Service"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">Detailed Description *</label>
              <textarea
                rows={3}
                className="input resize-none"
                placeholder="Describe your service, package inclusions, and equipment..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">Photos (Optional)</label>
              <label className="border-2 border-dashed border-gray-300 rounded-xl h-24 flex items-center justify-center gap-2 cursor-pointer hover:border-emerald-400 bg-gray-50/50">
                <Plus size={18} className="text-gray-400" /><span className="text-xs text-gray-500">Attach photos</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={() => toast.success('1 photo selected')} />
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {wizardStep === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Price / Rate (₱) *</label>
              <input
                type="number"
                className="input font-mono"
                placeholder="e.g. 650"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">Rate Unit</label>
              <select
                className="input"
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              >
                <option value="per session">per session</option>
                <option value="per hour">per hour</option>
                <option value="per day">per day</option>
                <option value="per month">per month</option>
                <option value="per item">per item</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {wizardStep === 3 && (
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">Primary Location / Base City *</label>
              <input
                className="input"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Cebu City"
              />
            </div>
            <div className="form-group">
              <label className="label">Service Area Coverage *</label>
              <input
                className="input"
                placeholder="e.g. Cebu City, Mandaue, Lapu-Lapu, Talisay"
                value={form.serviceArea}
                onChange={e => setForm(f => ({ ...f, serviceArea: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* Step 4: Availability */}
        {wizardStep === 4 && (
          <div className="flex flex-col gap-4">
            <label className="label">Available Days *</label>
            <div className="grid grid-cols-4 gap-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <label key={d} className={`flex items-center gap-2 text-xs font-medium cursor-pointer p-2 rounded-lg border transition-all ${form.days.includes(d) ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  <input
                    type="checkbox"
                    checked={form.days.includes(d)}
                    onChange={e => {
                      if (e.target.checked) setForm(f => ({ ...f, days: [...f.days, d] }))
                      else setForm(f => ({ ...f, days: f.days.filter(x => x !== d) }))
                    }}
                    className="accent-emerald-600"
                  />
                  {d}
                </label>
              ))}
            </div>

            {/* Calendar Availability Date Range (Month, Day, Year) */}
            <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="label !mb-0 flex items-center gap-1.5 text-emerald-950 font-semibold">
                  <Calendar size={14} className="text-emerald-600" />
                  Active Calendar Availability (Month, Day, Year) *
                </label>
                <label className="flex items-center gap-1.5 text-xs text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ongoingAvailability}
                    onChange={e => setForm(f => ({ ...f, ongoingAvailability: e.target.checked }))}
                    className="accent-emerald-600"
                  />
                  <span>Ongoing / No Expiration</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group !mb-0">
                  <span className="text-[11px] font-medium text-gray-500 mb-1 block">Available From (Month / Day / Year)</span>
                  <input
                    type="date"
                    className="input bg-white"
                    value={form.availableFrom}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, availableFrom: e.target.value }))}
                  />
                </div>
                {!form.ongoingAvailability && (
                  <div className="form-group !mb-0">
                    <span className="text-[11px] font-medium text-gray-500 mb-1 block">Available Until (Month / Day / Year)</span>
                    <input
                      type="date"
                      className="input bg-white"
                      value={form.availableTo}
                      min={form.availableFrom || new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, availableTo: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Operating From</label>
                <input
                  type="time"
                  className="input"
                  value={form.hoursFrom}
                  onChange={e => setForm(f => ({ ...f, hoursFrom: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">Operating To</label>
                <input
                  type="time"
                  className="input"
                  value={form.hoursTo}
                  onChange={e => setForm(f => ({ ...f, hoursTo: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Publish */}
        {wizardStep === 5 && (
          <div className="flex flex-col gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Listing Preview</p>
              <div className="w-full h-24 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {form.title || 'New Listing'}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">{form.title || 'Untitled Listing'}</p>
                <p className="text-xs text-gray-500">{form.type} · {form.category} · {form.location}</p>
                <p className="text-emerald-700 font-extrabold text-lg mt-1">{formatPHP(parseFloat(form.price) || 0)} <span className="text-xs font-normal text-gray-500">{form.unit}</span></p>
              </div>
            </div>

            <button
              onClick={handlePublish}
              className="btn-primary w-full py-2.5 font-bold shadow-sm"
              style={{ background: '#059669' }}
            >
              Publish Listing
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              if (wizardStep === 0) setShowAdd(false)
              else setWizardStep(s => Math.max(0, s - 1))
            }}
            className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <ArrowLeft size={14} /> Back
          </button>
          {wizardStep < 5 && (
            <button
              type="button"
              disabled={!isStepValid(wizardStep)}
              onClick={() => {
                if (isStepValid(wizardStep)) {
                  setWizardStep(s => s + 1)
                }
              }}
              className={`text-xs flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all ${
                isStepValid(wizardStep)
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
              }`}
            >
              <span>Next Step</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </Modal>

      {/* ── View Listing Details Modal ── */}
      <Modal
        open={Boolean(viewingListing)}
        onClose={() => setViewingListing(null)}
        title={viewingListing?.title || 'Listing Details'}
        size="md"
      >
        {viewingListing && (
          <div className="flex flex-col gap-4">
            <div className={`w-full h-28 rounded-2xl bg-gradient-to-br ${viewingListing.color || 'from-emerald-400 to-teal-500'} flex items-center justify-center text-white font-extrabold text-xl shadow-inner p-4 text-center`}>
              {viewingListing.title}
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs text-gray-400 font-medium">Category & Type</span>
                <p className="font-semibold text-gray-800 text-sm">{viewingListing.category} · {viewingListing.type}</p>
              </div>
              <Badge variant={statusVariant(viewingListing.status)} className="capitalize text-xs">
                {viewingListing.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-xs text-gray-400 font-medium block">Rate / Price</span>
                <span className="text-lg font-bold text-brand-600">{formatPHP(viewingListing.price)}</span>
                <span className="text-xs text-gray-400 ml-1">{viewingListing.unit}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-xs text-gray-400 font-medium block">Total Bookings</span>
                <span className="text-lg font-bold text-gray-900">{viewingListing.bookings}</span>
                <span className="text-xs text-emerald-600 font-semibold ml-1">completed</span>
              </div>
            </div>

            {/* ── Recent Bookers for this listing ── */}
            {(() => {
              const lid = String(viewingListing.id)
              const allBk = (() => { try { return JSON.parse(localStorage.getItem('serviceq_all_bookings')) || [] } catch { return [] } })()
              const custBk = (() => { try { return JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || [] } catch { return [] } })()
              const provBk = (() => { try { return JSON.parse(localStorage.getItem(`serviceq_provider_bookings_${user?.id}`)) || [] } catch { return [] } })()
              const genBk = (() => { try { return JSON.parse(localStorage.getItem('serviceq_provider_bookings')) || [] } catch { return [] } })()

              const seen = new Set()
              const recent = []
              for (const b of [...allBk, ...custBk, ...provBk, ...genBk]) {
                if (!seen.has(b.id) && (String(b.listingId) === lid || b.service?.toLowerCase() === viewingListing.title?.toLowerCase())) {
                  seen.add(b.id)
                  recent.push(b)
                }
              }
              recent.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
              const top5 = recent.slice(0, 5)
              if (top5.length === 0) return null

              return (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-700">Recent Bookers ({recent.length} total)</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {top5.map(b => (
                      <div key={b.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(b.customer || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{b.customer || 'Customer'}</p>
                          <p className="text-[10px] text-gray-400">{b.date || 'N/A'} · {b.sessions || 1} session{(b.sessions||1)>1?'s':''}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-emerald-700">{formatPHP(b.amount)}</p>
                          <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${
                            b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            b.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            b.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-700'
                          }`}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            <div className="space-y-2 text-xs text-gray-600 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-emerald-700 flex-shrink-0" />
                <span>Service Area: <strong>{viewingListing.serviceArea || 'Metro Cebu & Surrounding Cities'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-emerald-700 flex-shrink-0" />
                <span>Operating Hours: <strong>{viewingListing.hoursFrom || '08:00'} – {viewingListing.hoursTo || '17:00'}</strong> ({Array.isArray(viewingListing.days) ? viewingListing.days.join(', ') : 'Mon - Sat'})</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-emerald-700 flex-shrink-0" />
                <span>Active Dates: <strong>{viewingListing.availableFrom || 'Starting immediately'}</strong> {viewingListing.availableTo ? `until ${viewingListing.availableTo}` : '(Ongoing / No expiration)'}</span>
              </div>
            </div>



            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => openEditAvailability(viewingListing)}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60"
              >
                <Calendar size={14} /> Change Availability
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleStatus(viewingListing.id)
                  setViewingListing(v => ({ ...v, status: v.status === 'active' ? 'inactive' : 'active' }))
                }}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                {viewingListing.status === 'active' ? 'Deactivate Listing' : 'Activate Listing'}
              </button>
              <button
                type="button"
                onClick={() => setViewingListing(null)}
                className="btn-primary flex-1 py-2.5 text-xs font-bold"
                style={{ background: '#059669' }}
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Availability Modal (Change Availability Even After Published) ── */}
      <Modal
        open={Boolean(editingAvailability)}
        onClose={() => setEditingAvailability(null)}
        title="Edit Listing Availability"
        size="md"
      >
        {editingAvailability && (
          <div className="flex flex-col gap-4">
            <div className="border-b border-gray-100 pb-2">
              <h4 className="font-bold text-gray-900 text-sm">{editingAvailability.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Update working days, active calendar dates (Month, Day, Year), and operating hours. These updates take effect immediately for customer bookings.
              </p>
            </div>

            {/* Available Days */}
            <div className="space-y-1.5">
              <label className="label">Available Days *</label>
              <div className="grid grid-cols-4 gap-2">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <label key={d} className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer p-2 rounded-lg border transition-all ${availForm.days.includes(d) ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                    <input
                      type="checkbox"
                      checked={availForm.days.includes(d)}
                      onChange={e => {
                        if (e.target.checked) setAvailForm(f => ({ ...f, days: [...f.days, d] }))
                        else setAvailForm(f => ({ ...f, days: f.days.filter(x => x !== d) }))
                      }}
                      className="accent-emerald-600"
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>

            {/* Calendar Availability Date Range (Month, Day, Year) */}
            <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="label !mb-0 flex items-center gap-1.5 text-emerald-950 font-semibold">
                  <Calendar size={14} className="text-emerald-600" />
                  Active Calendar Availability (Month, Day, Year) *
                </label>
                <label className="flex items-center gap-1.5 text-xs text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availForm.ongoingAvailability}
                    onChange={e => setAvailForm(f => ({ ...f, ongoingAvailability: e.target.checked }))}
                    className="accent-emerald-600"
                  />
                  <span>Ongoing / No Expiration</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group !mb-0">
                  <span className="text-[11px] font-medium text-gray-500 mb-1 block">Available From (Month / Day / Year)</span>
                  <input
                    type="date"
                    className="input bg-white"
                    value={availForm.availableFrom}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setAvailForm(f => ({ ...f, availableFrom: e.target.value }))}
                  />
                </div>
                {!availForm.ongoingAvailability && (
                  <div className="form-group !mb-0">
                    <span className="text-[11px] font-medium text-gray-500 mb-1 block">Available Until (Month / Day / Year)</span>
                    <input
                      type="date"
                      className="input bg-white"
                      value={availForm.availableTo}
                      min={availForm.availableFrom || new Date().toISOString().split('T')[0]}
                      onChange={e => setAvailForm(f => ({ ...f, availableTo: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Operating From</label>
                <input
                  type="time"
                  className="input"
                  value={availForm.hoursFrom}
                  onChange={e => setAvailForm(f => ({ ...f, hoursFrom: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">Operating To</label>
                <input
                  type="time"
                  className="input"
                  value={availForm.hoursTo}
                  onChange={e => setAvailForm(f => ({ ...f, hoursTo: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingAvailability(null)}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAvailability}
                className="btn-primary flex-1 py-2.5 text-xs font-bold"
                style={{ background: '#059669' }}
              >
                Save Availability Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── KYC Verification Guard Modal ── */}
      <Modal
        open={showKycModal}
        onClose={() => setShowKycModal(false)}
        title="ID Verification Required"
        size="md"
      >
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Verify Your Identity to Add Listings</h3>
          <p className="text-xs text-gray-600 leading-relaxed mb-5 max-w-sm">
            To keep ServiceQ safe and maintain genuine trust across Cebu, service providers must submit valid government ID verification before publishing active listings.
          </p>
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-left text-xs text-amber-900 mb-6 space-y-1">
            <p className="font-bold">Required to unlock:</p>
            <p>• Publish and accept bookings from Cebu clients</p>
            <p>• Verified Partner badge on your public listings</p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setShowKycModal(false)
                navigate('/provider/profile')
              }}
              className="btn-primary w-full py-3 !bg-emerald-600 hover:!bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
            >
              Go to Profile to Verify ID →
            </button>
            <button
              type="button"
              onClick={() => {
                setShowKycModal(false)
                setShowAdd(true)
                setWizardStep(0)
              }}
              className="text-xs text-gray-400 hover:text-gray-600 py-1 underline"
            >
              Bypass for now (Demo / Testing)
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

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

const TABS = [
  { id: 'all',      label: 'All Listings' },
  { id: 'active',   label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'archived', label: 'Archived' },
]

const WIZARD_STEPS = ['Type & Category', 'Details & Photos', 'Pricing', 'Location', 'Availability', 'Review & Publish']

const INITIAL_FORM = {
  type: '',
  category: '',
  title: '',
  description: '',
  price: '',
  unit: 'per session',
  minDuration: '1',
  maxDuration: '10',
  location: '',
  serviceArea: '',
  days: [],
  hoursFrom: '08:00',
  hoursTo: '17:00',
}

export default function ProviderListings() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const [tab, setTab]               = useState('all')
  const [page, setPage]             = useState(1)
  const [showAdd, setShowAdd]       = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [viewingListing, setViewingListing] = useState(null)
  // Initialize listings from local storage (defaults to empty array for new providers)
  const [listings, setListings]     = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('serviceq_provider_listings'))
      if (Array.isArray(stored)) {
        return stored
      }
    } catch {}
    return []
  })

  // Wizard form state
  const [form, setForm] = useState(INITIAL_FORM)

  const handleOpenAdd = () => {
    setShowAdd(true)
    setWizardStep(0)
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

  const toggleStatus = id => {
    setListings(prev => {
      const updated = prev.map(l =>
        l.id === id ? { ...l, status: l.status === 'active' ? 'inactive' : 'active' } : l
      )
      try { localStorage.setItem('serviceq_provider_listings', JSON.stringify(updated)) } catch {}
      return updated
    })
    toast.success('Listing status updated')
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

  const handlePublish = () => {
    if (!form.title.trim()) {
      return toast.error('Please provide a listing title')
    }

    const newListing = {
      id: String(Date.now()),
      title: form.title.trim(),
      type: form.type || 'Service',
      category: form.category || 'General',
      price: parseFloat(form.price) || 0,
      unit: form.unit,
      status: 'active',
      bookings: 0,
      color: 'from-emerald-400 to-teal-400',
    }

    setListings(prev => {
      const updated = [newListing, ...prev]
      try {
        localStorage.setItem('serviceq_provider_listings', JSON.stringify(updated))
      } catch {}
      return updated
    })

    toast.success('New listing published successfully!')
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
                  <td className="p-4 text-gray-600 text-xs font-semibold">{l.bookings}</td>
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
                        onClick={() => toggleStatus(l.id)}
                        title={l.status === 'active' ? 'Disable Listing' : 'Activate Listing'}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      >
                        {l.status === 'active' ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
                      </button>
                      <button onClick={() => toast.success('Archived to records')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Archive size={15} /></button>
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
            onClick={() => setWizardStep(s => Math.max(0, s - 1))}
            disabled={wizardStep === 0}
            className="border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
              className="btn-primary text-xs flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#059669' }}
            >
              Next Step <ArrowRight size={14} />
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

            <div className="space-y-2 text-xs text-gray-600 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-emerald-700 flex-shrink-0" />
                <span>Service Area: <strong>Metro Cebu & Surrounding Cities</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-emerald-700 flex-shrink-0" />
                <span>Operating Hours: <strong>8:00 AM – 5:00 PM</strong> (Mon - Sat)</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
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

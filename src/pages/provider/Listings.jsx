import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Archive, Eye, ToggleLeft, ToggleRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'

const BASE_MOCK = [
  { id: '1', title: 'Home Cleaning Service',   type: 'Service', category: 'Cleaning', price: 500,  unit: 'per session', status: 'active',   bookings: 28, color: 'from-purple-400 to-pink-400' },
  { id: '2', title: 'Deep Cleaning Package',   type: 'Service', category: 'Cleaning', price: 1200, unit: 'per session', status: 'active',   bookings: 14, color: 'from-violet-400 to-purple-400' },
  { id: '3', title: 'Office Cleaning Service', type: 'Service', category: 'Cleaning', price: 800,  unit: 'per session', status: 'inactive', bookings: 5,  color: 'from-pink-400 to-rose-400' },
  { id: '4', title: 'Post-Event Cleanup',      type: 'Service', category: 'Cleaning', price: 1500, unit: 'per session', status: 'archived', bookings: 8,  color: 'from-fuchsia-400 to-pink-400' },
  { id: '5', title: 'Sofa & Upholstery Care',  type: 'Service', category: 'Cleaning', price: 650,  unit: 'per session', status: 'active',   bookings: 19, color: 'from-blue-400 to-indigo-400' },
  { id: '6', title: 'Window & Glass Cleaning', type: 'Service', category: 'Cleaning', price: 400,  unit: 'per session', status: 'active',   bookings: 11, color: 'from-cyan-400 to-blue-400' },
  { id: '7', title: 'Commercial Kitchen Clean',type: 'Service', category: 'Cleaning', price: 2200, unit: 'per session', status: 'inactive', bookings: 3,  color: 'from-amber-400 to-orange-400' },
  { id: '8', title: 'Move-in / Move-out Pack', type: 'Service', category: 'Cleaning', price: 1800, unit: 'per session', status: 'active',   bookings: 22, color: 'from-emerald-400 to-teal-400' },
  { id: '9', title: 'Mattress Sanitization',   type: 'Service', category: 'Cleaning', price: 550,  unit: 'per session', status: 'active',   bookings: 9,  color: 'from-teal-400 to-cyan-400' },
]

const TABS = [
  { id: 'all',      label: 'All Listings' },
  { id: 'active',   label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'archived', label: 'Archived' },
]

const WIZARD_STEPS = ['Type & Category', 'Details & Photos', 'Pricing', 'Location', 'Availability', 'Review & Publish']

const INITIAL_FORM = {
  type: 'Service',
  category: 'Cleaning',
  title: '',
  description: '',
  price: '500',
  unit: 'per session',
  minDuration: '1',
  maxDuration: '10',
  location: 'Cebu City',
  serviceArea: 'Metro Cebu',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  hoursFrom: '08:00',
  hoursTo: '17:00',
}

export default function ProviderListings() {
  const [tab, setTab]               = useState('all')
  const [page, setPage]             = useState(1)
  const [showAdd, setShowAdd]       = useState(false)
  const [wizardStep, setWizardStep] = useState(0)

  // Initialize listings from local storage merged with base mock
  const [listings, setListings]     = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('serviceq_provider_listings'))
      if (Array.isArray(stored) && stored.length > 0) {
        const storedIds = new Set(stored.map(l => l.id))
        const remaining = BASE_MOCK.filter(l => !storedIds.has(l.id))
        return [...stored, ...remaining]
      }
    } catch {}
    return BASE_MOCK
  })

  // Wizard form state
  const [form, setForm] = useState(INITIAL_FORM)

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

  const handlePublish = () => {
    if (!form.title.trim()) {
      return toast.error('Please provide a listing title')
    }

    const newListing = {
      id: String(Date.now()),
      title: form.title.trim(),
      type: form.type,
      category: form.category,
      price: parseFloat(form.price) || 500,
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
          onClick={() => { setShowAdd(true); setWizardStep(0) }}
          className="btn-primary gap-2"
          style={{ background: '#059669' }}
        >
          <Plus size={16} /> Add New Listing
        </button>
      </div>

      <Tabs tabs={TABS.map(t => ({ ...t, count: listings.filter(l => t.id === 'all' || l.status === t.id).length }))}
        active={tab} onChange={handleTabChange} />

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
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${l.color} flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                      ✓
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{l.title}</div>
                      <div className="text-xs text-gray-400">{l.category}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-600 text-xs">{l.type}</td>
                <td className="p-4 font-bold text-brand-600">{formatPHP(l.price)}<span className="text-xs text-gray-400 font-normal"> {l.unit}</span></td>
                <td className="p-4 text-gray-600 text-xs font-semibold">{l.bookings}</td>
                <td className="p-4"><Badge variant={statusVariant(l.status)} className="capitalize">{l.status}</Badge></td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
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

        {visible.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p className="font-medium text-gray-600">No listings in this category</p>
          </div>
        )}

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
            <label className="label">Offering Type</label>
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
              <label className="label">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="input"
              >
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
              <label className="label">Detailed Description</label>
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
              <label className="label">Primary Location / Base City</label>
              <input
                className="input"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Cebu City"
              />
            </div>
            <div className="form-group">
              <label className="label">Service Area Coverage</label>
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
            <label className="label">Available Days</label>
            <div className="grid grid-cols-4 gap-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <label key={d} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
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

        <div className="flex justify-between mt-6 pt-3 border-t border-gray-100">
          <button
            onClick={() => setWizardStep(s => Math.max(0, s - 1))}
            disabled={wizardStep === 0}
            className="btn-ghost text-xs disabled:opacity-40"
          >
            Back
          </button>
          {wizardStep < 5 && (
            <button
              onClick={() => {
                if (wizardStep === 1 && !form.title.trim()) {
                  return toast.error('Please enter a listing title')
                }
                setWizardStep(s => s + 1)
              }}
              className="btn-primary text-xs"
              style={{ background: '#059669' }}
            >
              Next Step →
            </button>
          )}
        </div>
      </Modal>
    </motion.div>
  )
}

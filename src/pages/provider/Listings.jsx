import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Archive, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'

const MOCK = [
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

export default function ProviderListings() {
  const [tab, setTab]               = useState('all')
  const [page, setPage]             = useState(1)
  const [showAdd, setShowAdd]       = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [listings, setListings]     = useState(MOCK)

  const PAGE_SIZE = 4
  const isDefaultAll = tab === 'all'

  const visible = listings.filter(l => tab === 'all' || l.status === tab)

  // Paginate only when default 'all' is selected; otherwise show unpaginated filtered list
  const displayed = isDefaultAll
    ? visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : visible

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setPage(1)
  }

  const toggleStatus = id => {
    setListings(prev => prev.map(l =>
      l.id === id ? { ...l, status: l.status === 'active' ? 'inactive' : 'active' } : l
    ))
    toast.success('Listing status updated')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <button onClick={() => { setShowAdd(true); setWizardStep(0) }}
          className="btn-primary gap-2" style={{ background: '#059669' }}>
          <Plus size={16} /> Add New Listing
        </button>
      </div>

      <Tabs tabs={TABS.map(t => ({ ...t, count: listings.filter(l => t.id === 'all' || l.status === t.id).length }))}
        active={tab} onChange={handleTabChange} />

      <div className="card overflow-x-auto p-0">
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
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${l.color} flex-shrink-0`} />
                    <div>
                      <div className="font-medium text-gray-900">{l.title}</div>
                      <div className="text-xs text-gray-400">{l.category}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-500">{l.type}</td>
                <td className="p-4 font-semibold text-brand-600">{formatPHP(l.price)}<span className="text-xs text-gray-400 font-normal"> {l.unit}</span></td>
                <td className="p-4 text-gray-600">{l.bookings}</td>
                <td className="p-4"><Badge variant={statusVariant(l.status)} className="capitalize">{l.status}</Badge></td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toast('Edit coming soon')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>
                    <button onClick={() => toggleStatus(l.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      {l.status === 'active' ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => toast('Archived')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Archive size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>No listings in this category</p>
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

        {wizardStep === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {['Service', 'Rental Property', 'Rental Item'].map(t => (
              <label key={t} className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 transition-all text-sm font-medium text-center">
                <input type="radio" name="ltype" className="hidden" />{t}
              </label>
            ))}
            <div className="form-group col-span-2 mt-2">
              <label className="label">Category</label>
              <select className="input"><option>Select category...</option></select>
            </div>
          </div>
        )}
        {wizardStep === 1 && (
          <div className="flex flex-col gap-4">
            <div className="form-group"><label className="label">Listing Title</label><input className="input" /></div>
            <div className="form-group"><label className="label">Description</label><textarea rows={3} className="input resize-none" /></div>
            <div className="form-group">
              <label className="label">Photos</label>
              <label className="border-2 border-dashed border-gray-300 rounded-xl h-28 flex items-center justify-center gap-2 cursor-pointer hover:border-emerald-400">
                <Plus size={20} className="text-gray-400" /><span className="text-sm text-gray-400">Upload photos</span>
                <input type="file" multiple accept="image/*" className="hidden" />
              </label>
            </div>
          </div>
        )}
        {wizardStep === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Price / Rate</label><input type="number" className="input" placeholder="e.g. 500" /></div>
            <div className="form-group"><label className="label">Rate Unit</label>
              <select className="input"><option>per session</option><option>per hour</option><option>per day</option><option>per month</option></select>
            </div>
            <div className="form-group"><label className="label">Minimum Duration</label><input type="number" className="input" /></div>
            <div className="form-group"><label className="label">Maximum Duration</label><input type="number" className="input" /></div>
          </div>
        )}
        {wizardStep === 3 && (
          <div className="flex flex-col gap-4">
            <div className="form-group"><label className="label">Address / Location</label><input className="input" /></div>
            <div className="form-group"><label className="label">Service Area</label><input className="input" placeholder="e.g. Quezon City, Pasig" /></div>
          </div>
        )}
        {wizardStep === 4 && (
          <div className="flex flex-col gap-4">
            <label className="label">Available Days</label>
            <div className="grid grid-cols-4 gap-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="accent-emerald-600" />{d}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="label">From</label><input type="time" className="input" /></div>
              <div className="form-group"><label className="label">To</label><input type="time" className="input" /></div>
            </div>
          </div>
        )}
        {wizardStep === 5 && (
          <div className="flex flex-col gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Listing Preview</p>
              <div className="w-full h-28 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 mb-3" />
              <p className="font-bold text-gray-900">Your New Listing</p>
              <p className="text-xs text-gray-500">Your category · Metro Manila</p>
            </div>
            <button onClick={() => { toast.success('Listing published!'); setShowAdd(false) }}
              className="btn-primary w-full" style={{ background: '#059669' }}>
              Publish Listing
            </button>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button onClick={() => setWizardStep(s => Math.max(0, s - 1))} disabled={wizardStep === 0} className="btn-ghost">Back</button>
          {wizardStep < 5
            ? <button onClick={() => setWizardStep(s => s + 1)} className="btn-primary" style={{ background: '#059669' }}>Next →</button>
            : null}
        </div>
      </Modal>
    </motion.div>
  )
}

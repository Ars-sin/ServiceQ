import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs } from '@/components/ui/Tabs'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2 } from 'lucide-react'

const TABS = [
  { id: 'general',       label: 'General' },
  { id: 'categories',    label: 'Categories' },
  { id: 'cancellation',  label: 'Cancellation Rules' },
  { id: 'faq',           label: 'FAQ' },
]

const INIT_CATS = [
  { id: '1', name: 'Services',             slug: 'services',       active: true },
  { id: '2', name: 'Rental Properties',    slug: 'rental-props',   active: true },
  { id: '3', name: 'Rental Items',         slug: 'rental-items',   active: true },
  { id: '4', name: 'Gadgets & Tech',       slug: 'gadgets',        active: true },
  { id: '5', name: 'Events & Equipment',   slug: 'events',         active: true },
  { id: '6', name: 'Vehicles',             slug: 'vehicles',       active: true },
]

const INIT_FAQS = [
  { id: '1', q: 'How do I book a service?',               a: 'Browse listings, select one, choose your date, and click Book Now.' },
  { id: '2', q: 'What payment methods are accepted?',     a: 'We accept GCash, Maya, BDO, BPI, and Metrobank bank transfers.' },
  { id: '3', q: 'How do I become a provider?',            a: 'Register as a provider, complete the onboarding wizard, and wait for KYC approval.' },
  { id: '4', q: 'Can I cancel a booking?',                a: 'Yes. Go to My Bookings, find the scheduled booking, and click Cancel.' },
  { id: '5', q: 'When will I receive my payout?',         a: 'Payouts are released after booking completion and processed within 3–5 business days.' },
]

export default function AdminSettings() {
  const [tab, setTab]         = useState('general')
  const [fee, setFee]         = useState('10')
  const [maintenance, setMaintenance] = useState(false)
  const [categories, setCats] = useState(INIT_CATS)
  const [newCat, setNewCat]   = useState('')
  const [faqs, setFaqs]       = useState(INIT_FAQS)
  const [newFaq, setNewFaq]   = useState({ q: '', a: '' })

  const addCategory = () => {
    if (!newCat.trim()) return toast.error('Enter category name')
    setCats(prev => [...prev, { id: Date.now().toString(), name: newCat, slug: newCat.toLowerCase().replace(/\s+/g, '-'), active: true }])
    setNewCat(''); toast.success('Category added!')
  }

  const addFaq = () => {
    if (!newFaq.q || !newFaq.a) return toast.error('Fill in both question and answer')
    setFaqs(prev => [...prev, { id: Date.now().toString(), ...newFaq }])
    setNewFaq({ q: '', a: '' }); toast.success('FAQ added!')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* General */}
      {tab === 'general' && (
        <div className="card flex flex-col gap-5">
          <h2 className="font-bold text-gray-900">General Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Platform Fee (%)</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} value={fee} onChange={e => setFee(e.target.value)} className="input" />
                <span className="text-gray-500 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Deducted from each successful booking</p>
            </div>
            <div className="form-group">
              <label className="label">Platform Name</label>
              <input className="input" defaultValue="ServiceQ" />
            </div>
            <div className="form-group">
              <label className="label">Support Email</label>
              <input type="email" className="input" defaultValue="support@serviceq.ph" />
            </div>
            <div className="form-group">
              <label className="label">Contact Number</label>
              <input className="input" defaultValue="+63 917 123 4567" />
            </div>
          </div>

          {/* Maintenance toggle */}
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div>
              <p className="font-semibold text-amber-800 text-sm">Maintenance Mode</p>
              <p className="text-xs text-amber-600">When enabled, only admins can access the platform</p>
            </div>
            <button onClick={() => { setMaintenance(v => !v); toast(maintenance ? 'Maintenance mode disabled' : '⚠️ Maintenance mode enabled') }}
              className={`relative w-12 h-6 rounded-full transition-colors ${maintenance ? 'bg-amber-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${maintenance ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <button onClick={() => toast.success('Settings saved!')} className="btn-primary w-fit">Save Settings</button>
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div className="card flex flex-col gap-4">
          <h2 className="font-bold text-gray-900">Manage Categories</h2>
          <div className="flex gap-2">
            <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name..." className="input flex-1" />
            <button onClick={addCategory} className="btn-primary gap-1"><Plus size={15} /> Add</button>
          </div>
          <div className="flex flex-col divide-y divide-gray-100">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <span className="text-xs text-gray-400 ml-2">/{c.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toast('Edit category')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>
                  <button onClick={() => { setCats(prev => prev.filter(x => x.id !== c.id)); toast('Category deleted') }}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Rules */}
      {tab === 'cancellation' && (
        <div className="card flex flex-col gap-4">
          <h2 className="font-bold text-gray-900">Cancellation Policy</h2>
          <div className="form-group">
            <label className="label">Cancellation Policy Text</label>
            <textarea rows={4} className="input resize-none"
              defaultValue="Customers may cancel a scheduled booking at any time before the provider begins the service. Cancellations made within 24 hours of the scheduled start time may not qualify for a full refund." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Refund – Cancelled before 24hrs', val: '100%' },
              { label: 'Refund – Cancelled within 24hrs', val: '50%' },
              { label: 'Refund – No-show by customer',    val: '0%' },
              { label: 'Refund – Provider cancels',       val: '100%' },
            ].map(r => (
              <div key={r.label} className="form-group">
                <label className="label">{r.label}</label>
                <input className="input" defaultValue={r.val} />
              </div>
            ))}
          </div>
          <button onClick={() => toast.success('Cancellation rules saved!')} className="btn-primary w-fit">Save Rules</button>
        </div>
      )}

      {/* FAQ Management */}
      {tab === 'faq' && (
        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-3">
            <h2 className="font-bold text-gray-900">Add New FAQ</h2>
            <div className="form-group">
              <label className="label">Question</label>
              <input className="input" value={newFaq.q} onChange={e => setNewFaq(f => ({ ...f, q: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Answer</label>
              <textarea rows={2} className="input resize-none" value={newFaq.a} onChange={e => setNewFaq(f => ({ ...f, a: e.target.value }))} />
            </div>
            <button onClick={addFaq} className="btn-primary w-fit gap-1"><Plus size={14} /> Add FAQ</button>
          </div>

          <div className="flex flex-col gap-2">
            {faqs.map(f => (
              <div key={f.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{f.q}</p>
                    <p className="text-sm text-gray-500 mt-1">{f.a}</p>
                  </div>
                  <button onClick={() => { setFaqs(prev => prev.filter(x => x.id !== f.id)); toast('FAQ deleted') }}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 ml-3 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

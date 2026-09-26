import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs } from '@/components/ui/Tabs'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Globe, Wrench, XCircle, HelpCircle } from 'lucide-react'

const TABS = [
  { id: 'general',      label: 'General' },
  { id: 'categories',   label: 'Categories' },
  { id: 'cancellation', label: 'Cancellation Rules' },
  { id: 'faq',          label: 'FAQ' },
]

const INIT_CATS = [
  { id: '1', name: 'Services',           slug: 'services',     active: true },
  { id: '2', name: 'Rental Properties',  slug: 'rental-props', active: true },
  { id: '3', name: 'Rental Items',       slug: 'rental-items', active: true },
  { id: '4', name: 'Gadgets & Tech',     slug: 'gadgets',      active: true },
  { id: '5', name: 'Events & Equipment', slug: 'events',       active: true },
  { id: '6', name: 'Vehicles',           slug: 'vehicles',     active: true },
]

const INIT_FAQS = [
  { id: '1', q: 'How do I book a service?',           a: 'Browse listings, select one, choose your date, and click Book Now.' },
  { id: '2', q: 'What payment methods are accepted?', a: 'We accept GCash, Maya, BDO, BPI, and Metrobank bank transfers.' },
  { id: '3', q: 'How do I become a provider?',        a: 'Register as a provider, complete the onboarding wizard, and wait for KYC approval.' },
  { id: '4', q: 'Can I cancel a booking?',            a: 'Yes. Go to My Bookings, find the scheduled booking, and click Cancel.' },
  { id: '5', q: 'When will I receive my payout?',     a: 'Payouts are released after booking completion and processed within 3–5 business days.' },
]

const REFUND_RULES = [
  { label: 'Cancelled before 24 hrs', val: '100%' },
  { label: 'Cancelled within 24 hrs', val: '50%' },
  { label: 'No-show by customer',     val: '0%' },
  { label: 'Provider cancels',        val: '100%' },
]

export default function AdminSettings() {
  const [tab, setTab]         = useState('general')
  const [fee, setFee]         = useState('10')
  const [maintenance, setMaintenance] = useState(
    () => localStorage.getItem('serviceq_maintenance_mode') === 'true'
  )
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

  const toggleMaintenance = () => {
    const next = !maintenance
    setMaintenance(next)
    localStorage.setItem('serviceq_maintenance_mode', String(next))
    toast(next ? '⚠️ Maintenance mode enabled' : '✅ Maintenance mode disabled')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">Configure platform-wide rules and content</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── General ── */}
      {tab === 'general' && (
        <div className="flex flex-col gap-5">
          {/* Basic Settings Card */}
          <div className="card flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <Globe size={16} className="text-brand-600" />
              <h2 className="font-bold text-gray-900">General Configuration</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="form-group">
                <label className="label">Platform Fee (%)</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={100} value={fee} onChange={e => setFee(e.target.value)} className="input flex-1" />
                  <span className="text-gray-400 text-sm font-medium">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Deducted from each successful booking transaction</p>
              </div>
            </div>
            <button onClick={() => toast.success('Settings saved!')} className="btn-primary w-fit">Save Settings</button>
          </div>

          {/* Maintenance Toggle Card */}
          <div className={`card flex items-center justify-between gap-4 border ${maintenance ? 'border-amber-200 bg-amber-50' : 'border-gray-100'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${maintenance ? 'bg-amber-100' : 'bg-gray-100'}`}>
                <Wrench size={16} className={maintenance ? 'text-amber-600' : 'text-gray-500'} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${maintenance ? 'text-amber-800' : 'text-gray-800'}`}>Maintenance Mode</p>
                <p className={`text-xs mt-0.5 ${maintenance ? 'text-amber-600' : 'text-gray-400'}`}>
                  {maintenance ? 'Active — only admins can access the platform' : 'Disabled — platform is publicly accessible'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleMaintenance}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${maintenance ? 'bg-amber-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${maintenance ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      )}

      {/* ── Categories ── */}
      {tab === 'categories' && (
        <div className="card flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <h2 className="font-bold text-gray-900">Manage Categories</h2>
          </div>
          <div className="flex gap-2">
            <input
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              placeholder="New category name..."
              className="input flex-1"
            />
            <button onClick={addCategory} className="btn-primary gap-1.5 px-4">
              <Plus size={15} /> Add
            </button>
          </div>
          <div className="flex flex-col divide-y divide-gray-100 -my-1">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-500" />
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                    <span className="text-xs text-gray-400 ml-2 font-mono">/{c.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toast('Edit category')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => { setCats(prev => prev.filter(x => x.id !== c.id)); toast('Category deleted') }}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cancellation Rules ── */}
      {tab === 'cancellation' && (
        <div className="card flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <XCircle size={16} className="text-red-500" />
            <h2 className="font-bold text-gray-900">Cancellation Policy</h2>
          </div>
          <div className="form-group">
            <label className="label">Policy Text</label>
            <textarea
              rows={4}
              className="input resize-none"
              defaultValue="Customers may cancel a scheduled booking at any time before the provider begins the service. Cancellations made within 24 hours of the scheduled start time may not qualify for a full refund."
            />
          </div>
          <div>
            <p className="label mb-3">Refund Rules</p>
            <div className="grid grid-cols-2 gap-3">
              {REFUND_RULES.map(r => (
                <div key={r.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium mb-1.5">{r.label}</p>
                  <input className="input text-sm py-1.5" defaultValue={r.val} />
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => toast.success('Cancellation rules saved!')} className="btn-primary w-fit">Save Rules</button>
        </div>
      )}

      {/* ── FAQ Management ── */}
      {tab === 'faq' && (
        <div className="flex flex-col gap-5">
          <div className="card flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <HelpCircle size={16} className="text-brand-600" />
              <h2 className="font-bold text-gray-900">Add New FAQ</h2>
            </div>
            <div className="form-group">
              <label className="label">Question</label>
              <input className="input" value={newFaq.q} onChange={e => setNewFaq(f => ({ ...f, q: e.target.value }))} placeholder="e.g. How do I book a service?" />
            </div>
            <div className="form-group">
              <label className="label">Answer</label>
              <textarea rows={3} className="input resize-none" value={newFaq.a} onChange={e => setNewFaq(f => ({ ...f, a: e.target.value }))} placeholder="Provide a clear, helpful answer..." />
            </div>
            <button onClick={addFaq} className="btn-primary w-fit gap-1.5">
              <Plus size={14} /> Add FAQ
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((f, idx) => (
              <div key={f.id} className="card flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xs font-bold text-gray-300 mt-0.5 flex-shrink-0">#{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{f.q}</p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{f.a}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setFaqs(prev => prev.filter(x => x.id !== f.id)); toast('FAQ deleted') }}
                  className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

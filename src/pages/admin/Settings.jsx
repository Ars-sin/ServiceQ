import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs } from '@/components/ui/Tabs'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Edit2, Globe, Wrench, XCircle, HelpCircle,
  Home, Package, Laptop, PartyPopper, Car, Sparkles,
  GraduationCap, Utensils, Shield, Heart, Camera
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const TABS = [
  { id: 'general',      label: 'General' },
  { id: 'categories',   label: 'Categories' },
  { id: 'cancellation', label: 'Cancellation Rules' },
  { id: 'faq',          label: 'FAQ' },
]

const ICON_COMPONENTS = {
  Wrench,
  Home,
  Package,
  Laptop,
  PartyPopper,
  Car,
  Sparkles,
  GraduationCap,
  Utensils,
  Shield,
  Heart,
  Camera,
}

const AVAILABLE_ICONS = [
  'Wrench', 'Home', 'Package', 'Laptop', 'PartyPopper', 'Car',
  'Sparkles', 'GraduationCap', 'Utensils', 'Shield', 'Heart', 'Camera'
]

const INIT_CATS = [
  { id: '1', name: 'Services',           slug: 'services',     icon: 'Wrench',        active: true },
  { id: '2', name: 'Rental Properties',  slug: 'rental-props', icon: 'Home',          active: true },
  { id: '3', name: 'Rental Items',       slug: 'rental-items', icon: 'Package',       active: true },
  { id: '4', name: 'Gadgets & Tech',     slug: 'gadgets',      icon: 'Laptop',        active: true },
  { id: '5', name: 'Events & Equipment', slug: 'events',       icon: 'PartyPopper',   active: true },
  { id: '6', name: 'Vehicles',           slug: 'vehicles',     icon: 'Car',           active: true },
]

const INIT_FAQS = [
  { id: '1', q: 'How do I book a service?',           a: 'Browse listings, select one, choose your date, and click Book Now.' },
  { id: '2', q: 'What payment methods are accepted?', a: 'We accept GCash, Maya, BDO, BPI, and Metrobank bank transfers.' },
  { id: '3', q: 'How do I become a provider?',        a: 'Register as a provider, complete the onboarding wizard, and wait for KYC approval.' },
  { id: '4', q: 'Can I cancel a booking?',            a: 'Yes. Go to My Bookings, find the scheduled booking, and click Cancel.' },
  { id: '5', q: 'When will I receive my payout?',     a: 'Payouts are released after booking completion and processed within 3–5 business days.' },
]

const DEFAULT_REFUND_RULES = [
  { label: 'Cancelled before 24 hrs', val: '100%' },
  { label: 'Cancelled within 24 hrs', val: '50%' },
  { label: 'No-show by customer',     val: '0%' },
  { label: 'Provider cancels',        val: '100%' },
]

const DEFAULT_CANCELLATION_POLICY = "Customers may cancel a scheduled booking at any time before the provider begins the service. Cancellations made within 24 hours of the scheduled start time may not qualify for a full refund."

export default function AdminSettings() {
  const [tab, setTab] = useState('general')

  // ── General Tab State (SQI-36) ──────────────────────────────────────────
  const [generalForm, setGeneralForm] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('serviceq_platform_settings_general'))
      if (stored) return stored
    } catch {}
    return {
      platformName: 'ServiceQ',
      supportEmail: 'support@serviceq.ph',
      contactNumber: '+63 917 123 4567',
      fee: '10',
    }
  })
  const [savedGeneral, setSavedGeneral] = useState(generalForm)
  const [isEditingGeneral, setIsEditingGeneral] = useState(false)

  // Maintenance state
  const [maintenance, setMaintenance] = useState(
    () => localStorage.getItem('serviceq_maintenance_mode') === 'true'
  )

  // ── Categories Tab State (SQI-37) ───────────────────────────────────────
  const [categories, setCats] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('serviceq_admin_categories'))
      if (Array.isArray(stored) && stored.length > 0) return stored
    } catch {}
    return INIT_CATS
  })
  const [newCat, setNewCat] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('Wrench')
  const [editCatModal, setEditCatModal] = useState(null) // category object being edited

  // ── Cancellation Rules Tab State (SQI-39) ───────────────────────────────
  const [isEditingCancellation, setIsEditingCancellation] = useState(false)
  const [policyText, setPolicyText] = useState(() => {
    return localStorage.getItem('serviceq_cancellation_policy') || DEFAULT_CANCELLATION_POLICY
  })
  const [savedPolicyText, setSavedPolicyText] = useState(policyText)
  const [refundRules, setRefundRules] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('serviceq_refund_rules'))
      if (Array.isArray(stored) && stored.length > 0) return stored
    } catch {}
    return DEFAULT_REFUND_RULES
  })
  const [savedRefundRules, setSavedRefundRules] = useState(refundRules)

  // ── FAQ Tab State ───────────────────────────────────────────────────────
  const [faqs, setFaqs]     = useState(INIT_FAQS)
  const [newFaq, setNewFaq] = useState({ q: '', a: '' })

  useEffect(() => {
    const loadRemoteSettings = async () => {
      try {
        const { data: catData } = await supabase.from('platform_settings').select('value').eq('key', 'serviceq_categories').maybeSingle()
        if (catData?.value) {
          const parsed = typeof catData.value === 'string' ? JSON.parse(catData.value) : catData.value
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCats(parsed)
            localStorage.setItem('serviceq_admin_categories', JSON.stringify(parsed))
          }
        }
      } catch {}
    }
    loadRemoteSettings()
  }, [])

  // ── Handlers: General ───────────────────────────────────────────────────
  const handleSaveGeneral = async () => {
    try {
      localStorage.setItem('serviceq_platform_settings_general', JSON.stringify(generalForm))
      setSavedGeneral(generalForm)
      setIsEditingGeneral(false)

      await supabase.from('platform_settings').upsert({
        key: 'serviceq_platform_settings_general',
        value: JSON.stringify(generalForm),
        updated_at: new Date().toISOString(),
      })
      toast.success('Platform settings saved successfully!')
    } catch (err) {
      toast.success('Platform settings saved locally!')
    }
  }

  const handleCancelGeneral = () => {
    setGeneralForm(savedGeneral)
    setIsEditingGeneral(false)
  }

  const toggleMaintenance = () => {
    const next = !maintenance
    setMaintenance(next)
    localStorage.setItem('serviceq_maintenance_mode', String(next))
    toast(next ? '⚠️ Maintenance mode enabled' : '✅ Maintenance mode disabled')
  }

  // ── Handlers: Categories (SQI-37) ───────────────────────────────────────
  const persistCategories = async (updated) => {
    setCats(updated)
    try {
      localStorage.setItem('serviceq_admin_categories', JSON.stringify(updated))
      await supabase.from('platform_settings').upsert({
        key: 'serviceq_categories',
        value: JSON.stringify(updated),
        updated_at: new Date().toISOString(),
      })
    } catch {}
    window.dispatchEvent(new Event('serviceq_categories_updated'))
  }

  const addCategory = () => {
    if (!newCat.trim()) return toast.error('Enter category name')
    const created = {
      id: Date.now().toString(),
      name: newCat.trim(),
      slug: newCat.toLowerCase().replace(/\s+/g, '-'),
      icon: newCatIcon || 'Wrench',
      active: true,
    }
    const updated = [...categories, created]
    persistCategories(updated)
    setNewCat('')
    setNewCatIcon('Wrench')
    toast.success('Category and icon added successfully!')
  }

  const handleSaveEditCategory = () => {
    if (!editCatModal || !editCatModal.name.trim()) return toast.error('Category name cannot be empty')
    const updated = categories.map(c => c.id === editCatModal.id ? {
      ...c,
      name: editCatModal.name.trim(),
      slug: editCatModal.slug.trim() || editCatModal.name.toLowerCase().replace(/\s+/g, '-'),
      icon: editCatModal.icon || 'Wrench',
    } : c)
    persistCategories(updated)
    setEditCatModal(null)
    toast.success('Category and icon updated successfully!')
  }

  const handleDeleteCategory = (id) => {
    const updated = categories.filter(c => c.id !== id)
    persistCategories(updated)
    toast.success('Category deleted')
  }

  // ── Handlers: Cancellation Rules (SQI-39) ───────────────────────────────
  const handleSaveCancellation = async () => {
    try {
      localStorage.setItem('serviceq_cancellation_policy', policyText)
      localStorage.setItem('serviceq_refund_rules', JSON.stringify(refundRules))
      setSavedPolicyText(policyText)
      setSavedRefundRules(refundRules)
      setIsEditingCancellation(false)

      await supabase.from('platform_settings').upsert({
        key: 'serviceq_cancellation_rules',
        value: JSON.stringify({ policy: policyText, rules: refundRules }),
        updated_at: new Date().toISOString(),
      })
      toast.success('Cancellation policy and rules saved!')
    } catch {
      toast.success('Cancellation rules saved locally!')
    }
  }

  const handleCancelCancellation = () => {
    setPolicyText(savedPolicyText)
    setRefundRules(savedRefundRules)
    setIsEditingCancellation(false)
  }

  // ── Handlers: FAQ ───────────────────────────────────────────────────────
  const addFaq = () => {
    if (!newFaq.q || !newFaq.a) return toast.error('Fill in both question and answer')
    setFaqs(prev => [...prev, { id: Date.now().toString(), ...newFaq }])
    setNewFaq({ q: '', a: '' })
    toast.success('FAQ added!')
  }

  const renderCategoryIcon = (iconName, size = 16) => {
    const IconComponent = ICON_COMPONENTS[iconName] || Wrench
    return <IconComponent size={size} />
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">Configure platform-wide rules, categories, and policies</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── Tab: General (SQI-36) ── */}
      {tab === 'general' && (
        <div className="flex flex-col gap-5">
          {/* Basic Settings Card */}
          <div className="card flex flex-col gap-5 border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-brand-600" />
                <h2 className="font-bold text-gray-900">General Configuration</h2>
              </div>
              {!isEditingGeneral ? (
                <button
                  type="button"
                  onClick={() => setIsEditingGeneral(true)}
                  className="btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <Edit2 size={13} /> Edit
                </button>
              ) : (
                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                  Editing Mode
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Platform Name</label>
                <input
                  disabled={!isEditingGeneral}
                  value={generalForm.platformName}
                  onChange={e => setGeneralForm(g => ({ ...g, platformName: e.target.value }))}
                  className={`input text-sm ${
                    !isEditingGeneral ? 'bg-gray-50/80 text-gray-700 cursor-not-allowed border-gray-200' : 'bg-white text-gray-900'
                  }`}
                />
              </div>

              <div className="form-group">
                <label className="label">Support Email</label>
                <input
                  type="email"
                  disabled={!isEditingGeneral}
                  value={generalForm.supportEmail}
                  onChange={e => setGeneralForm(g => ({ ...g, supportEmail: e.target.value }))}
                  className={`input text-sm ${
                    !isEditingGeneral ? 'bg-gray-50/80 text-gray-700 cursor-not-allowed border-gray-200' : 'bg-white text-gray-900'
                  }`}
                />
              </div>

              <div className="form-group">
                <label className="label">Contact Number</label>
                <input
                  disabled={!isEditingGeneral}
                  value={generalForm.contactNumber}
                  onChange={e => setGeneralForm(g => ({ ...g, contactNumber: e.target.value }))}
                  className={`input text-sm ${
                    !isEditingGeneral ? 'bg-gray-50/80 text-gray-700 cursor-not-allowed border-gray-200' : 'bg-white text-gray-900'
                  }`}
                />
              </div>

              <div className="form-group">
                <label className="label">Platform Fee (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!isEditingGeneral}
                    value={generalForm.fee}
                    onChange={e => setGeneralForm(g => ({ ...g, fee: e.target.value }))}
                    className={`input flex-1 text-sm ${
                      !isEditingGeneral ? 'bg-gray-50/80 text-gray-700 cursor-not-allowed border-gray-200' : 'bg-white text-gray-900'
                    }`}
                  />
                  <span className="text-gray-400 text-sm font-medium">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Deducted from each successful booking transaction</p>
              </div>
            </div>

            {/* SQI-36: Cancel and Save Settings buttons activated only when Edit button is clicked */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={!isEditingGeneral}
                onClick={handleCancelGeneral}
                className={`btn-sm text-xs px-4 py-2 rounded-xl transition-all ${
                  isEditingGeneral
                    ? 'btn-secondary'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isEditingGeneral}
                onClick={handleSaveGeneral}
                className={`btn-sm text-xs px-5 py-2 rounded-xl font-bold transition-all ${
                  isEditingGeneral
                    ? 'btn-primary'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                Save Settings
              </button>
            </div>
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

      {/* ── Tab: Categories (SQI-37) ── */}
      {tab === 'categories' && (
        <div className="card flex flex-col gap-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="font-bold text-gray-900">Manage Categories &amp; Icons</h2>
            <span className="text-xs text-gray-400">{categories.length} categories</span>
          </div>

          {/* Add Category Form with Icon Picker */}
          <div className="flex flex-col sm:flex-row gap-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
            <div className="flex-1 form-group mb-0">
              <label className="label text-xs">Category Name</label>
              <input
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="e.g. Photography & Video"
                className="input text-sm bg-white"
              />
            </div>

            <div className="sm:w-48 form-group mb-0">
              <label className="label text-xs">Category Icon</label>
              <select
                value={newCatIcon}
                onChange={e => setNewCatIcon(e.target.value)}
                className="input text-sm bg-white capitalize"
              >
                {AVAILABLE_ICONS.map(ic => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addCategory}
                className="btn-primary gap-1.5 px-5 py-2.5 rounded-xl h-[42px] text-xs font-bold w-full sm:w-auto"
              >
                <Plus size={15} /> Add Category
              </button>
            </div>
          </div>

          {/* Categories List with Icons & Edit Functionality */}
          <div className="flex flex-col divide-y divide-gray-100 -my-1">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100 flex-shrink-0">
                    {renderCategoryIcon(c.icon || 'Wrench', 17)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                    <span className="text-xs text-gray-400 ml-2 font-mono">/{c.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditCatModal(c)}
                    className="p-2 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors"
                    title="Edit category & icon"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Cancellation Rules (SQI-39) ── */}
      {tab === 'cancellation' && (
        <div className="card flex flex-col gap-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <XCircle size={18} className="text-red-500" />
              <h2 className="font-bold text-gray-900">Cancellation Policy</h2>
            </div>
            {!isEditingCancellation ? (
              <button
                type="button"
                onClick={() => setIsEditingCancellation(true)}
                className="btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <Edit2 size={13} /> Edit
              </button>
            ) : (
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                Editing Mode
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="label">Policy Text</label>
            <textarea
              rows={4}
              disabled={!isEditingCancellation}
              value={policyText}
              onChange={e => setPolicyText(e.target.value)}
              className={`input resize-none text-sm leading-relaxed ${
                !isEditingCancellation ? 'bg-gray-50/80 text-gray-700 cursor-not-allowed border-gray-200' : 'bg-white text-gray-900'
              }`}
            />
          </div>

          <div>
            <p className="label mb-3">Refund Rules</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {refundRules.map((r, idx) => (
                <div key={r.label} className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1.5">{r.label}</p>
                  <input
                    disabled={!isEditingCancellation}
                    value={r.val}
                    onChange={e => {
                      const updated = [...refundRules]
                      updated[idx] = { ...updated[idx], val: e.target.value }
                      setRefundRules(updated)
                    }}
                    className={`input text-sm py-1.5 ${
                      !isEditingCancellation ? 'bg-gray-100/80 text-gray-700 cursor-not-allowed border-gray-200' : 'bg-white text-gray-900'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SQI-39: Action buttons active only when Edit is clicked */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              disabled={!isEditingCancellation}
              onClick={handleCancelCancellation}
              className={`btn-sm text-xs px-4 py-2 rounded-xl transition-all ${
                isEditingCancellation
                  ? 'btn-secondary'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isEditingCancellation}
              onClick={handleSaveCancellation}
              className={`btn-sm text-xs px-5 py-2 rounded-xl font-bold transition-all ${
                isEditingCancellation
                  ? 'btn-primary'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: FAQ ── */}
      {tab === 'faq' && (
        <div className="flex flex-col gap-5">
          <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <HelpCircle size={18} className="text-brand-600" />
              <h2 className="font-bold text-gray-900">Add New FAQ</h2>
            </div>
            <div className="form-group">
              <label className="label">Question</label>
              <input
                className="input text-sm"
                value={newFaq.q}
                onChange={e => setNewFaq(f => ({ ...f, q: e.target.value }))}
                placeholder="e.g. How do I book a service?"
              />
            </div>
            <div className="form-group">
              <label className="label">Answer</label>
              <textarea
                rows={3}
                className="input resize-none text-sm"
                value={newFaq.a}
                onChange={e => setNewFaq(f => ({ ...f, a: e.target.value }))}
                placeholder="Provide a clear, helpful answer..."
              />
            </div>
            <button onClick={addFaq} className="btn-primary w-fit gap-1.5 text-xs font-bold px-4 py-2 rounded-xl">
              <Plus size={14} /> Add FAQ
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((f, idx) => (
              <div key={f.id} className="card flex items-start justify-between gap-4 border border-gray-100 shadow-xs">
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

      {/* ── Modal: Edit Category & Icon (SQI-37) ── */}
      <Modal open={!!editCatModal} onClose={() => setEditCatModal(null)} title="Edit Category & Icon">
        {editCatModal && (
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">Category Name</label>
              <input
                value={editCatModal.name}
                onChange={e => setEditCatModal(c => ({ ...c, name: e.target.value }))}
                className="input text-sm"
              />
            </div>

            <div className="form-group">
              <label className="label">URL Slug</label>
              <input
                value={editCatModal.slug}
                onChange={e => setEditCatModal(c => ({ ...c, slug: e.target.value }))}
                className="input text-sm font-mono text-xs"
              />
            </div>

            <div className="form-group">
              <label className="label">Select Icon</label>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {AVAILABLE_ICONS.map(ic => {
                  const isSelected = editCatModal.icon === ic
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setEditCatModal(c => ({ ...c, icon: ic }))}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-300'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                      }`}
                    >
                      {renderCategoryIcon(ic, 20)}
                      <span className="text-[10px] font-medium truncate w-full text-center">{ic}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditCatModal(null)}
                className="btn-secondary text-xs px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditCategory}
                className="btn-primary text-xs px-5 py-2 rounded-xl font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

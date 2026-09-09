import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProviderProfile() {
  const [form, setForm] = useState({
    businessName: 'Maria Santos Cleaning Services',
    description: 'Professional home and office cleaning services across Metro Manila.',
    serviceArea: 'Quezon City, Pasig, Mandaluyong',
    hoursFrom: '08:00', hoursTo: '18:00',
    phone: '09171234567', email: 'maria.santos@email.com',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>

      {/* Avatar */}
      <div className="card flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-3xl">MS</div>
        <div className="flex-1">
          <p className="font-bold text-gray-900">Maria Santos</p>
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle size={14} className="text-green-500" />
            <span className="text-sm text-green-600 font-medium">KYC Verified</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Member since March 2024</p>
        </div>
        <label className="btn-secondary btn-sm gap-1 cursor-pointer">
          <Upload size={13} /> Change Photo
          <input type="file" accept="image/*" className="hidden" />
        </label>
      </div>

      {/* Business Info */}
      <div className="card flex flex-col gap-4">
        <h2 className="font-bold text-gray-900">Business Information</h2>
        <div className="form-group"><label className="label">Business Name</label>
          <input className="input" value={form.businessName} onChange={e => set('businessName', e.target.value)} /></div>
        <div className="form-group"><label className="label">Description</label>
          <textarea rows={3} className="input resize-none" value={form.description} onChange={e => set('description', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="label">Hours From</label>
            <input type="time" className="input" value={form.hoursFrom} onChange={e => set('hoursFrom', e.target.value)} /></div>
          <div className="form-group"><label className="label">Hours To</label>
            <input type="time" className="input" value={form.hoursTo} onChange={e => set('hoursTo', e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="label">Service Area</label>
          <input className="input" value={form.serviceArea} onChange={e => set('serviceArea', e.target.value)} /></div>
      </div>

      {/* Contact */}
      <div className="card flex flex-col gap-4">
        <h2 className="font-bold text-gray-900">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="label">Phone Number</label>
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div className="form-group"><label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        </div>
      </div>

      {/* Payout Info */}
      <div className="card flex flex-col gap-3">
        <h2 className="font-bold text-gray-900">Payout Information</h2>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">GCash</p>
            <p className="text-sm text-gray-500">09171••••67</p>
          </div>
          <button onClick={() => toast('Edit payout method')} className="text-sm text-brand-600 hover:underline">Edit</button>
        </div>
      </div>

      <button onClick={() => toast.success('Profile updated!')} className="btn-primary w-fit" style={{ background: '#059669' }}>
        Save Changes
      </button>
    </motion.div>
  )
}

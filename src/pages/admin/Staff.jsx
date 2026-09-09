import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { ADMIN_ROLES } from '@/lib/constants'

const STAFF = [
  { id: '1', name: 'Bryce Obien',      email: 'bryce@serviceq.ph',   role: 'superadmin',        status: 'active', lastActive: '2026-09-09' },
  { id: '2', name: 'John Monares',     email: 'john@serviceq.ph',    role: 'financial_staff',   status: 'active', lastActive: '2026-09-09' },
  { id: '3', name: 'Rain Verano',      email: 'rain@serviceq.ph',    role: 'support_moderator', status: 'active', lastActive: '2026-09-08' },
  { id: '4', name: 'Amy Dela Cruz',    email: 'amy@serviceq.ph',     role: 'support_moderator', status: 'active', lastActive: '2026-09-07' },
  { id: '5', name: 'Leo Santos',       email: 'leo@serviceq.ph',     role: 'financial_staff',   status: 'inactive',lastActive: '2026-08-20' },
]

const PERMISSIONS = [
  { key: 'manage_users',     label: 'Manage Users' },
  { key: 'manage_providers', label: 'Manage Providers' },
  { key: 'approve_kyc',      label: 'Approve KYC' },
  { key: 'manage_listings',  label: 'Manage Listings' },
  { key: 'view_financials',  label: 'View Financials' },
  { key: 'process_payouts',  label: 'Process Payouts' },
  { key: 'manage_settings',  label: 'Manage Settings' },
  { key: 'view_audit',       label: 'View Audit Log' },
]

const ROLE_PERMS = {
  superadmin:        ['manage_users','manage_providers','approve_kyc','manage_listings','view_financials','process_payouts','manage_settings','view_audit'],
  financial_staff:   ['view_financials','process_payouts','view_audit'],
  support_moderator: ['manage_users','manage_providers','approve_kyc','manage_listings','view_audit'],
}

const roleVariant = r => ({ superadmin: 'danger', financial_staff: 'brand', support_moderator: 'info' }[r] ?? 'neutral')
const roleLabel   = r => ADMIN_ROLES.find(a => a.id === r)?.label ?? r

export default function AdminStaff() {
  const [staff, setStaff]     = useState(STAFF)
  const [addModal, setAdd]    = useState(false)
  const [form, setForm]       = useState({ name: '', email: '', role: 'support_moderator' })

  const handleAdd = () => {
    if (!form.name || !form.email) return toast.error('Fill in all fields')
    setStaff(prev => [...prev, { id: Date.now().toString(), ...form, status: 'active', lastActive: 'Just now' }])
    toast.success('Staff member added!')
    setAdd(false); setForm({ name: '', email: '', role: 'support_moderator' })
  }

  const toggleStatus = id => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s))
    toast.success('Status updated')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff & Roles</h1>
        <button onClick={() => setAdd(true)} className="btn-primary gap-2">
          <Plus size={16} /> Add Staff Member
        </button>
      </div>

      {/* Staff table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="p-4 font-medium">Staff Member</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Last Active</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 text-xs font-bold">
                      {s.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant={roleVariant(s.role)}>{roleLabel(s.role)}</Badge>
                </td>
                <td className="p-4">
                  <Badge variant={s.status === 'active' ? 'success' : 'neutral'} className="capitalize">{s.status}</Badge>
                </td>
                <td className="p-4 text-gray-400 text-xs">{s.lastActive}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => toast('Edit role coming soon')} className="btn-ghost btn-sm text-xs">Edit Role</button>
                    <button onClick={() => toggleStatus(s.id)}
                      className={`btn-sm rounded-lg px-2 py-1 text-xs font-medium ${s.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {s.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Matrix */}
      <div className="card overflow-x-auto p-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Role Permissions Matrix</h2>
          <p className="text-sm text-gray-500 mt-0.5">Which actions each role can perform</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="p-4 font-medium">Permission</th>
              <th className="p-4 text-center font-medium">Super Admin</th>
              <th className="p-4 text-center font-medium">Financial Staff</th>
              <th className="p-4 text-center font-medium">Support Moderator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {PERMISSIONS.map(p => (
              <tr key={p.key} className="hover:bg-gray-50">
                <td className="p-4 text-gray-700 font-medium">{p.label}</td>
                {['superadmin', 'financial_staff', 'support_moderator'].map(role => (
                  <td key={role} className="p-4 text-center">
                    {ROLE_PERMS[role].includes(p.key)
                      ? <Check size={18} className="text-green-500 mx-auto" />
                      : <X size={16} className="text-gray-300 mx-auto" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      <Modal open={addModal} onClose={() => setAdd(false)} title="Add Staff Member">
        <div className="flex flex-col gap-4">
          <div className="form-group">
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan dela Cruz" />
          </div>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@serviceq.ph" />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ADMIN_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setAdd(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleAdd} className="btn-primary flex-1">Add Staff</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

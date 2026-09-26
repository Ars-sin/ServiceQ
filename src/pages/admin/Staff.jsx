import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, X, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { ADMIN_ROLES } from '@/lib/constants'

const STAFF = [
  { id: '1', name: 'Bryce Obien',   email: 'bryce@serviceq.ph', role: 'superadmin',        status: 'active',   lastActive: '2026-09-09' },
  { id: '2', name: 'John Monares',  email: 'john@serviceq.ph',  role: 'financial_staff',   status: 'active',   lastActive: '2026-09-09' },
  { id: '3', name: 'Rain Verano',   email: 'rain@serviceq.ph',  role: 'support_moderator', status: 'active',   lastActive: '2026-09-08' },
  { id: '4', name: 'Amy Dela Cruz', email: 'amy@serviceq.ph',   role: 'support_moderator', status: 'active',   lastActive: '2026-09-07' },
  { id: '5', name: 'Leo Santos',    email: 'leo@serviceq.ph',   role: 'financial_staff',   status: 'inactive', lastActive: '2026-08-20' },
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

const ROLE_COLOR = {
  superadmin:        { badge: 'danger',  pill: 'bg-rose-100 text-rose-700',    border: 'border-rose-100 bg-rose-50/30' },
  financial_staff:   { badge: 'brand',   pill: 'bg-blue-100 text-blue-700',    border: 'border-blue-100 bg-blue-50/30' },
  support_moderator: { badge: 'info',    pill: 'bg-purple-100 text-purple-700', border: 'border-purple-100 bg-purple-50/30' },
}

const roleLabel = r => ADMIN_ROLES.find(a => a.id === r)?.label ?? r

export default function AdminStaff() {
  const [staff, setStaff] = useState(STAFF)
  const [addModal, setAdd] = useState(false)
  const [form, setForm]    = useState({ name: '', email: '', role: 'support_moderator' })

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff &amp; Roles</h1>
          <p className="text-xs text-gray-400 mt-0.5">{staff.filter(s => s.status === 'active').length} active staff members</p>
        </div>
        <button onClick={() => setAdd(true)} className="btn-primary gap-2">
          <Plus size={16} /> Add Staff Member
        </button>
      </div>

      {/* Staff table */}
      <div className="card overflow-x-auto p-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Team Members</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100 bg-gray-50">
              <th className="p-4 font-semibold">Staff Member</th>
              <th className="p-4 font-semibold">Role</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Last Active</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 text-xs font-bold flex-shrink-0">
                      {s.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant={ROLE_COLOR[s.role]?.badge ?? 'neutral'}>{roleLabel(s.role)}</Badge>
                </td>
                <td className="p-4">
                  <Badge variant={s.status === 'active' ? 'success' : 'neutral'} className="capitalize">{s.status}</Badge>
                </td>
                <td className="p-4 text-gray-400 text-xs">{s.lastActive}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toast('Edit role coming soon')}
                      className="btn-ghost btn-sm text-xs"
                    >
                      Edit Role
                    </button>
                    <button
                      onClick={() => toggleStatus(s.id)}
                      className={`btn-sm rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                        s.status === 'active'
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {s.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Access Cards */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Role Access &amp; Scopes</h2>
          <p className="text-xs text-gray-400 mt-0.5">Permissions and capabilities assigned to each staff role</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              role: 'superadmin',
              title: 'Super Admin',
              badge: 'danger',
              badgeLabel: 'Full Access',
              desc: 'Complete administrative control across the entire ServiceQ platform.',
              perms: ['Manage Users & Providers', 'KYC Identity Approvals', 'Listing Moderation & Actions', 'Financials & Payout Approvals', 'Platform Settings & Fees', 'System Audit Log Access'],
              nPerms: [],
              footer: '👑 Unrestricted system privileges',
              footerColor: 'text-rose-700',
              borderColor: 'border-rose-100 bg-rose-50/20',
            },
            {
              role: 'financial_staff',
              title: 'Financial Staff',
              badge: 'brand',
              badgeLabel: 'Finance Scope',
              desc: 'Manages payouts, transaction ledgers, refund tracking, and revenue oversight.',
              perms: ['Full Transaction Ledger', 'Process Provider Payouts', 'Issue Customer Refunds', 'System Audit Log'],
              nPerms: ['No User / KYC management', 'No Platform settings access'],
              footer: '💳 Dedicated to ledger & withdrawals',
              footerColor: 'text-blue-700',
              borderColor: 'border-blue-100 bg-blue-50/20',
            },
            {
              role: 'support_moderator',
              title: 'Support Moderator',
              badge: 'info',
              badgeLabel: 'Support Scope',
              desc: 'Handles community safety, KYC identity verification, and listing moderation.',
              perms: ['Review & Approve KYC ID', 'Manage Customer & Provider Status', 'Moderate & Disable Listings', 'Dismiss Listing Reports', 'Audit Log Inspection'],
              nPerms: ['No access to financial ledger'],
              footer: '🛡️ Customer trust & verification',
              footerColor: 'text-purple-700',
              borderColor: 'border-purple-100 bg-purple-50/20',
            },
          ].map(r => (
            <div key={r.role} className={`card p-5 border rounded-2xl flex flex-col justify-between ${r.borderColor}`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900">{r.title}</span>
                  <Badge variant={r.badge}>{r.badgeLabel}</Badge>
                </div>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{r.desc}</p>
                <div className="space-y-2 text-xs">
                  {r.perms.map(p => (
                    <div key={p} className="flex items-center gap-1.5 text-gray-700">
                      <Check size={13} className="text-emerald-500 flex-shrink-0" /> {p}
                    </div>
                  ))}
                  {r.nPerms.map(p => (
                    <div key={p} className="flex items-center gap-1.5 text-gray-400">
                      <X size={13} className="text-gray-300 flex-shrink-0" /> {p}
                    </div>
                  ))}
                </div>
              </div>
              <div className={`mt-4 pt-3 border-t border-gray-100 text-[11px] font-semibold ${r.footerColor}`}>
                {r.footer}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="card overflow-x-auto p-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Role Permissions Matrix</h2>
          <p className="text-xs text-gray-400 mt-0.5">Which actions each role can perform across the platform</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100 bg-gray-50">
              <th className="p-4 font-semibold">Permission</th>
              <th className="p-4 text-center font-semibold">Super Admin</th>
              <th className="p-4 text-center font-semibold">Financial Staff</th>
              <th className="p-4 text-center font-semibold">Support Moderator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {PERMISSIONS.map(p => (
              <tr key={p.key} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-gray-700 font-medium">{p.label}</td>
                {['superadmin', 'financial_staff', 'support_moderator'].map(role => (
                  <td key={role} className="p-4 text-center">
                    {ROLE_PERMS[role].includes(p.key)
                      ? <Check size={16} className="text-emerald-500 mx-auto" />
                      : <X size={14} className="text-gray-300 mx-auto" />}
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

          {/* Dynamic Role Access Preview */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <span className="font-semibold text-gray-800 block mb-2 flex items-center gap-1.5">
              <Shield size={13} className="text-brand-600" /> Assigned Capabilities:
            </span>
            <ul className="space-y-1.5 text-gray-600">
              {ROLE_PERMS[form.role]?.map(permKey => {
                const perm = PERMISSIONS.find(p => p.key === permKey)
                return (
                  <li key={permKey} className="flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-500 flex-shrink-0" />
                    <span>{perm?.label || permKey}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setAdd(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleAdd} className="btn-primary flex-1">Add Staff</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

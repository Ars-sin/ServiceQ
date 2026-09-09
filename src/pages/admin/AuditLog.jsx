import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { relativeTime } from '@/lib/utils'

const LOGS = [
  { id: 'a01', staff: 'Bryce Obien',   role: 'superadmin',        action: 'Provider Approved',     target: 'Maria Santos',       desc: 'KYC verified and provider account approved.',         before: { status: 'under_verification' }, after: { status: 'approved' },           ip: '192.168.1.10', ts: '2026-09-09T08:12:00Z' },
  { id: 'a02', staff: 'John Monares',   role: 'financial_staff',   action: 'Withdrawal Processed',  target: 'WD-004 – LensHub PH',desc: 'Processed withdrawal of ₱2,100 via GCash.',           before: { status: 'approved' },          after: { status: 'completed' },          ip: '192.168.1.11', ts: '2026-09-09T09:05:00Z' },
  { id: 'a03', staff: 'Rain Verano',    role: 'support_moderator', action: 'Listing Disabled',      target: 'Suspicious Item',    desc: 'Disabled listing due to policy violation reports.',   before: { status: 'active' },            after: { status: 'inactive' },           ip: '192.168.1.12', ts: '2026-09-09T10:30:00Z' },
  { id: 'a04', staff: 'Bryce Obien',   role: 'superadmin',        action: 'Platform Fee Updated',  target: 'System Settings',    desc: 'Changed platform fee from 8% to 10%.',                before: { fee: '8%' },                   after: { fee: '10%' },                   ip: '192.168.1.10', ts: '2026-09-08T14:00:00Z' },
  { id: 'a05', staff: 'John Monares',   role: 'financial_staff',   action: 'Refund Issued',         target: 'SQ-G7H8',            desc: 'Issued full refund of ₱3,850 to Rico Santos.',        before: { payout: 'none' },              after: { payout: 'refunded' },           ip: '192.168.1.11', ts: '2026-09-08T11:20:00Z' },
  { id: 'a06', staff: 'Rain Verano',    role: 'support_moderator', action: 'User Suspended',        target: 'Rico Santos',        desc: 'Suspended user account due to repeated violations.',  before: { status: 'active' },            after: { status: 'suspended' },          ip: '192.168.1.12', ts: '2026-09-07T16:45:00Z' },
  { id: 'a07', staff: 'Bryce Obien',   role: 'superadmin',        action: 'Staff Role Changed',    target: 'Amy Dela Cruz',      desc: 'Changed role from financial_staff to support_moderator.', before: { role: 'financial_staff' },  after: { role: 'support_moderator' },    ip: '192.168.1.10', ts: '2026-09-07T09:00:00Z' },
  { id: 'a08', staff: 'John Monares',   role: 'financial_staff',   action: 'Withdrawal Rejected',   target: 'WD-006 – MotoRent', desc: 'Rejected withdrawal: incomplete bank account details.', before: { status: 'pending_review' },   after: { status: 'rejected' },           ip: '192.168.1.11', ts: '2026-09-06T13:30:00Z' },
  { id: 'a09', staff: 'Rain Verano',    role: 'support_moderator', action: 'KYC Requested Correction', target: 'Carl Reyes',     desc: 'Requested clearer ID photo for KYC verification.',    before: { kyc: 'pending' },             after: { kyc: 'correction_requested' },  ip: '192.168.1.12', ts: '2026-09-06T10:15:00Z' },
  { id: 'a10', staff: 'Bryce Obien',   role: 'superadmin',        action: 'Provider KYC Rejected', target: 'Riza Mercado',       desc: 'KYC rejected: ID appears expired.',                   before: { status: 'under_verification' },after: { status: 'rejected' },           ip: '192.168.1.10', ts: '2026-09-05T15:00:00Z' },
]

const actionVariant = a => {
  if (a.includes('Approved') || a.includes('Processed') || a.includes('Completed')) return 'success'
  if (a.includes('Rejected') || a.includes('Suspended') || a.includes('Banned'))    return 'danger'
  if (a.includes('Updated') || a.includes('Changed') || a.includes('Disabled'))     return 'warning'
  return 'info'
}

const roleLabel = r => ({ superadmin: 'Super Admin', financial_staff: 'Financial Staff', support_moderator: 'Support Mod' }[r] ?? r)

export default function AdminAuditLog() {
  const [diffModal, setDiff] = useState(null)
  const [search, setSearch]  = useState('')

  const filtered = LOGS.filter(l =>
    !search ||
    l.staff.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.target.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>

      {/* Immutability notice */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <ShieldCheck size={20} className="flex-shrink-0 text-blue-500" />
        <span><strong>Read-Only Log</strong> — This audit trail is immutable and cannot be modified or deleted by any user.</span>
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by staff, action, or target..." className="input" />

      {/* Log table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="p-4 font-medium">Timestamp</th>
              <th className="p-4 font-medium">Staff Member</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Action</th>
              <th className="p-4 font-medium">Target</th>
              <th className="p-4 font-medium">Description</th>
              <th className="p-4 font-medium">IP Address</th>
              <th className="p-4 font-medium">Changes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(log.ts).toLocaleString('en-PH')}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 text-xs font-bold flex-shrink-0">
                      {log.staff.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-gray-900 whitespace-nowrap">{log.staff}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-xs text-gray-500 whitespace-nowrap">{roleLabel(log.role)}</span>
                </td>
                <td className="p-4">
                  <Badge variant={actionVariant(log.action)} className="text-xs whitespace-nowrap">{log.action}</Badge>
                </td>
                <td className="p-4 text-gray-600 whitespace-nowrap">{log.target}</td>
                <td className="p-4 text-gray-500 text-xs max-w-xs">{log.desc}</td>
                <td className="p-4 font-mono text-xs text-gray-400">{log.ip}</td>
                <td className="p-4">
                  <button onClick={() => setDiff(log)}
                    className="text-xs text-brand-600 hover:underline whitespace-nowrap">
                    View Changes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <AlertCircle size={40} className="mx-auto mb-2 opacity-30" />
            <p>No log entries found</p>
          </div>
        )}
      </div>

      {/* Diff Modal */}
      <Modal open={!!diffModal} onClose={() => setDiff(null)} title="Change Details" size="md">
        {diffModal && (
          <div className="flex flex-col gap-4">
            <div className="text-sm">
              <span className="font-semibold text-gray-700">Action: </span>
              <Badge variant={actionVariant(diffModal.action)}>{diffModal.action}</Badge>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-gray-700">Target: </span>{diffModal.target}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs text-red-400 font-semibold mb-2">BEFORE</p>
                <pre className="text-xs text-red-700 whitespace-pre-wrap">{JSON.stringify(diffModal.before, null, 2)}</pre>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-400 font-semibold mb-2">AFTER</p>
                <pre className="text-xs text-green-700 whitespace-pre-wrap">{JSON.stringify(diffModal.after, null, 2)}</pre>
              </div>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-4">
              <span>🕐 {new Date(diffModal.ts).toLocaleString('en-PH')}</span>
              <span>🌐 {diffModal.ip}</span>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatPHP, statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'

const TRANSACTIONS = [
  { id: 'TXN-001', customer: 'Ana Reyes',   provider: 'Maria Santos', service: 'Home Cleaning',  gross: 1100, fee: 110, net: 990,  date: '2026-09-05', status: 'successful' },
  { id: 'TXN-002', customer: 'Marco Lopez', provider: 'TechRent PH',  service: 'Laptop Rental',  gross: 880,  fee: 88,  net: 792,  date: '2026-09-04', status: 'successful' },
  { id: 'TXN-003', customer: 'Grace Tan',   provider: 'Events Pro',   service: 'Sound System',   gross: 3850, fee: 385, net: 3465, date: '2026-09-03', status: 'pending' },
  { id: 'TXN-004', customer: 'Rico Santos', provider: 'LensHub PH',   service: 'Camera Rental',  gross: 660,  fee: 66,  net: 594,  date: '2026-09-02', status: 'refunded' },
  { id: 'TXN-005', customer: 'Joy DC',      provider: 'Maria Santos', service: 'Deep Cleaning',  gross: 1320, fee: 132, net: 1188, date: '2026-09-01', status: 'successful' },
  { id: 'TXN-006', customer: 'Ben Aguilar', provider: 'MotoRent',     service: 'Motorcycle',     gross: 800,  fee: 80,  net: 720,  date: '2026-08-31', status: 'failed' },
]

const WITHDRAWALS = [
  { id: 'WD-001', provider: 'Maria Santos', method: 'GCash',  amount: 3500, requested: '2026-09-06', status: 'pending_review' },
  { id: 'WD-002', provider: 'TechRent PH',  method: 'Maya',   amount: 7800, requested: '2026-09-05', status: 'verified' },
  { id: 'WD-003', provider: 'Events Pro',   method: 'BDO',    amount: 12000,requested: '2026-09-04', status: 'approved' },
  { id: 'WD-004', provider: 'LensHub PH',   method: 'GCash',  amount: 2100, requested: '2026-09-03', status: 'processing' },
  { id: 'WD-005', provider: 'Engr. Cruz',   method: 'BPI',    amount: 4500, requested: '2026-09-02', status: 'completed' },
  { id: 'WD-006', provider: 'MotoRent',     method: 'GCash',  amount: 1800, requested: '2026-09-01', status: 'rejected' },
]

const WITHDRAWAL_FLOW = ['pending_review', 'verified', 'approved', 'processing', 'completed']

const wdVariant = s => ({ pending_review: 'warning', verified: 'info', approved: 'brand', processing: 'info', completed: 'success', rejected: 'danger' }[s] ?? 'neutral')

export default function AdminFinancials() {
  const [tab, setTab] = useState('ledger')
  const [withdrawals, setWithdrawals] = useState(WITHDRAWALS)
  const [txnFilter, setTxnFilter] = useState('all')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectNote, setRejectNote] = useState('')

  const nextStatus = s => {
    const idx = WITHDRAWAL_FLOW.indexOf(s)
    return idx < WITHDRAWAL_FLOW.length - 1 ? WITHDRAWAL_FLOW[idx + 1] : null
  }

  const advanceWd = (id, status) => {
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status } : w))
    toast.success(`Status updated to: ${status.replace('_', ' ')}`)
  }

  const rejectWd = () => {
    if (!rejectNote.trim()) return toast.error('Enter rejection reason')
    setWithdrawals(prev => prev.map(w => w.id === rejectModal.id ? { ...w, status: 'rejected' } : w))
    toast.error('Withdrawal rejected')
    setRejectModal(null); setRejectNote('')
  }

  const filtered = TRANSACTIONS.filter(t => txnFilter === 'all' || t.status === txnFilter)

  const txnTabs = [
    { id: 'ledger',   label: 'Transaction Ledger' },
    { id: 'withdrawals', label: `Withdrawal Queue (${withdrawals.filter(w => w.status !== 'completed' && w.status !== 'rejected').length})` },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Successful"  value={formatPHP(TRANSACTIONS.filter(t => t.status === 'successful').reduce((s, t) => s + t.gross, 0))} icon={CheckCircle} color="success" />
        <StatCard label="Pending"           value={formatPHP(TRANSACTIONS.filter(t => t.status === 'pending').reduce((s, t) => s + t.gross, 0))}   icon={Clock}        color="warning" />
        <StatCard label="Refunded"          value={formatPHP(TRANSACTIONS.filter(t => t.status === 'refunded').reduce((s, t) => s + t.gross, 0))}  icon={AlertCircle}  color="danger" />
        <StatCard label="Platform Revenue"  value={formatPHP(TRANSACTIONS.filter(t => t.status === 'successful').reduce((s, t) => s + t.fee, 0))}  icon={DollarSign}   color="brand" />
      </div>

      <Tabs tabs={txnTabs} active={tab} onChange={setTab} />

      {/* Transaction Ledger */}
      {tab === 'ledger' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <select value={txnFilter} onChange={e => setTxnFilter(e.target.value)} className="input w-auto">
              <option value="all">All Transactions</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                  <th className="p-4 font-medium">Txn ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Provider</th>
                  <th className="p-4 font-medium">Service</th>
                  <th className="p-4 font-medium">Gross</th>
                  <th className="p-4 font-medium">Fee</th>
                  <th className="p-4 font-medium">Net</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs text-gray-500">{t.id}</td>
                    <td className="p-4 font-medium text-gray-900">{t.customer}</td>
                    <td className="p-4 text-gray-600">{t.provider}</td>
                    <td className="p-4 text-gray-600">{t.service}</td>
                    <td className="p-4">{formatPHP(t.gross)}</td>
                    <td className="p-4 text-rose-500">{formatPHP(t.fee)}</td>
                    <td className="p-4 font-bold text-brand-600">{formatPHP(t.net)}</td>
                    <td className="p-4 text-gray-400">{t.date}</td>
                    <td className="p-4">
                      <Badge variant={statusVariant(t.status)} className="capitalize">{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Withdrawal Queue */}
      {tab === 'withdrawals' && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                <th className="p-4 font-medium">Request ID</th>
                <th className="p-4 font-medium">Provider</th>
                <th className="p-4 font-medium">Method</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Requested</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {withdrawals.map(w => {
                const next = nextStatus(w.status)
                const actionLabel = { pending_review: 'Verify', verified: 'Approve', approved: 'Process', processing: 'Complete' }[w.status]
                return (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs text-gray-500">{w.id}</td>
                    <td className="p-4 font-medium text-gray-900">{w.provider}</td>
                    <td className="p-4 text-gray-600">{w.method}</td>
                    <td className="p-4 font-bold text-brand-600">{formatPHP(w.amount)}</td>
                    <td className="p-4 text-gray-400">{w.requested}</td>
                    <td className="p-4">
                      <Badge variant={wdVariant(w.status)} className="capitalize">{w.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {next && actionLabel && (
                          <button onClick={() => advanceWd(w.id, next)}
                            className="btn-sm bg-brand-100 text-brand-700 rounded-lg px-2 py-1 text-xs font-medium hover:bg-brand-200">
                            {actionLabel}
                          </button>
                        )}
                        {w.status !== 'completed' && w.status !== 'rejected' && (
                          <button onClick={() => setRejectModal(w)}
                            className="btn-sm bg-red-100 text-red-700 rounded-lg px-2 py-1 text-xs font-medium hover:bg-red-200">
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Withdrawal Request">
        <div className="flex flex-col gap-4">
          <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">
            Rejecting withdrawal of <strong>{formatPHP(rejectModal?.amount ?? 0)}</strong> from <strong>{rejectModal?.provider}</strong>
          </div>
          <div className="form-group">
            <label className="label">Rejection Reason</label>
            <textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              placeholder="Explain why this withdrawal is rejected..." className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={rejectWd} className="btn-danger flex-1">Confirm Reject</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

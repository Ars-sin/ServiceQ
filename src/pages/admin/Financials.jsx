import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { formatPHP, statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import toast from 'react-hot-toast'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const INIT_TRANSACTIONS = [
  { id: 'TXN-001', customer: 'Ana Reyes',     provider: 'Maria Santos', service: 'Home Cleaning',    gross: 1100, fee: 110, net: 990,  date: '2026-09-05', status: 'successful' },
  { id: 'TXN-002', customer: 'Marco Lopez',   provider: 'TechRent PH',  service: 'Laptop Rental',    gross: 880,  fee: 88,  net: 792,  date: '2026-09-04', status: 'successful' },
  { id: 'TXN-003', customer: 'Grace Tan',     provider: 'Events Pro',   service: 'Sound System',     gross: 3850, fee: 385, net: 3465, date: '2026-09-03', status: 'pending' },
  { id: 'TXN-004', customer: 'Rico Santos',   provider: 'LensHub PH',   service: 'Camera Rental',    gross: 660,  fee: 66,  net: 594,  date: '2026-09-02', status: 'refunded' },
  { id: 'TXN-005', customer: 'Joy DC',        provider: 'Maria Santos', service: 'Deep Cleaning',    gross: 1320, fee: 132, net: 1188, date: '2026-09-01', status: 'successful' },
  { id: 'TXN-006', customer: 'Ben Aguilar',   provider: 'MotoRent',     service: 'Motorcycle',       gross: 800,  fee: 80,  net: 720,  date: '2026-08-31', status: 'failed' },
  { id: 'TXN-007', customer: 'Carlo Mendoza', provider: 'Fix-It Crew',  service: 'AC Repair',        gross: 750,  fee: 75,  net: 675,  date: '2026-08-30', status: 'successful' },
  { id: 'TXN-008', customer: 'Elena Gomez',   provider: 'Lutong Sugbo', service: 'Catering Service', gross: 2500, fee: 250, net: 2250, date: '2026-08-29', status: 'successful' },
  { id: 'TXN-009', customer: 'David Lim',     provider: 'PowerPro Cebu',service: 'Generator Rental', gross: 1200, fee: 120, net: 1080, date: '2026-08-28', status: 'pending' },
  { id: 'TXN-010', customer: 'Sophia Sy',     provider: 'SkyView PH',   service: 'Drone Kit',        gross: 1100, fee: 110, net: 990,  date: '2026-08-27', status: 'successful' },
]

const WITHDRAWALS = [
  { id: 'WD-001', provider: 'Maria Santos', method: 'GCash', amount: 3500,  requested: '2026-09-06', status: 'pending_review' },
  { id: 'WD-002', provider: 'TechRent PH',  method: 'Maya',  amount: 7800,  requested: '2026-09-05', status: 'verified' },
  { id: 'WD-003', provider: 'Events Pro',   method: 'BDO',   amount: 12000, requested: '2026-09-04', status: 'approved' },
  { id: 'WD-004', provider: 'LensHub PH',   method: 'GCash', amount: 2100,  requested: '2026-09-03', status: 'processing' },
  { id: 'WD-005', provider: 'Engr. Cruz',   method: 'BPI',   amount: 4500,  requested: '2026-09-02', status: 'completed' },
  { id: 'WD-006', provider: 'MotoRent',     method: 'GCash', amount: 1800,  requested: '2026-09-01', status: 'rejected' },
]

const WITHDRAWAL_FLOW = ['pending_review', 'verified', 'approved', 'processing', 'completed']
const wdVariant = s => ({ pending_review: 'warning', verified: 'info', approved: 'brand', processing: 'info', completed: 'success', rejected: 'danger' }[s] ?? 'neutral')

export default function AdminFinancials() {
  const [tab, setTab] = useState('ledger')
  const [page, setPage] = useState(1)

  const loadTransactions = () => {
    try {
      const all = JSON.parse(localStorage.getItem('serviceq_all_bookings')) || []
      const cust = JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || []
      const merged = [...all]
      const ids = new Set(merged.map(b => b.id))
      for (const b of cust) {
        if (!ids.has(b.id)) {
          merged.push(b)
          ids.add(b.id)
        }
      }
      if (merged.length > 0) {
        const mapped = merged.map(b => ({
          id: b.id,
          customer: b.customer || 'Customer',
          provider: b.provider || 'Provider',
          service: b.service || 'Service',
          gross: Number(b.amount) || 0,
          fee: Number(b.fee) || Math.round((Number(b.amount) || 0) * 0.1),
          net: Number(b.net) || Math.round((Number(b.amount) || 0) * 0.9),
          date: b.date || b.createdAt?.slice(0, 10) || new Date().toISOString().split('T')[0],
          status: b.status === 'completed' ? 'successful' : b.status === 'cancelled' ? 'refunded' : 'pending'
        }))
        return mapped
      }
    } catch {}
    return INIT_TRANSACTIONS
  }

  const loadWithdrawals = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('serviceq_provider_withdrawals'))
      if (Array.isArray(stored) && stored.length > 0) {
        return stored
      }
    } catch {}
    return WITHDRAWALS
  }

  const [transactions, setTransactions] = useState(loadTransactions)
  const [withdrawals, setWithdrawals] = useState(loadWithdrawals)
  const [txnFilter, setTxnFilter] = useState('all')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectNote, setRejectNote] = useState('')

  // Live real-time sync with provider and customer actions
  useEffect(() => {
    const handleSync = () => {
      setTransactions(loadTransactions())
      setWithdrawals(loadWithdrawals())
    }
    window.addEventListener('serviceq_withdrawals_updated', handleSync)
    window.addEventListener('serviceq_bookings_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('serviceq_withdrawals_updated', handleSync)
      window.removeEventListener('serviceq_bookings_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const PAGE_SIZE = 6
  const isDefaultAll = txnFilter === 'all'

  const issueRefund = (id) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'refunded' } : t))
    toast.success('Refund issued successfully. Counter updated.')
  }

  const nextStatus = s => {
    const idx = WITHDRAWAL_FLOW.indexOf(s)
    return idx < WITHDRAWAL_FLOW.length - 1 ? WITHDRAWAL_FLOW[idx + 1] : null
  }

  const advanceWd = (id, status) => {
    setWithdrawals(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, status } : w)
      try {
        localStorage.setItem('serviceq_provider_withdrawals', JSON.stringify(updated))
        window.dispatchEvent(new Event('serviceq_withdrawals_updated'))
        window.dispatchEvent(new Event('storage'))
      } catch {}
      return updated
    })
    toast.success(`Status updated to: ${status.replace('_', ' ')}`)
  }

  const approveWithdrawal = (id) => {
    setWithdrawals(prev => {
      const wd = prev.find(w => w.id === id)
      const updated = prev.map(w => w.id === id ? { ...w, status: 'completed', approved_at: new Date().toISOString() } : w)
      try {
        localStorage.setItem('serviceq_provider_withdrawals', JSON.stringify(updated))
        if (wd?.amount) {
          const currPend = Number(localStorage.getItem('serviceq_provider_pending_balance') || 0)
          localStorage.setItem('serviceq_provider_pending_balance', String(Math.max(0, currPend - Number(wd.amount))))
        }
        const auditLog = JSON.parse(localStorage.getItem('serviceq_audit_log')) || []
        const auditEntry = {
          id: `a${Date.now()}`,
          staff: 'Admin',
          role: 'superadmin',
          action: 'Withdrawal Approved & Paid',
          target: id,
          desc: `Admin approved payout of ₱${Number(wd?.amount || 0).toLocaleString()} for ${wd?.provider || 'Provider'} via ${wd?.method || 'Payout'}.`,
          before: { status: wd?.status || 'pending' },
          after: { status: 'completed' },
          ip: '127.0.0.1',
          ts: new Date().toISOString(),
        }
        localStorage.setItem('serviceq_audit_log', JSON.stringify([auditEntry, ...auditLog]))
        window.dispatchEvent(new Event('serviceq_withdrawals_updated'))
        window.dispatchEvent(new Event('storage'))
      } catch {}
      return updated
    })
    toast.success('Withdrawal approved and marked as paid out!')
  }

  const rejectWd = () => {
    if (!rejectNote.trim()) return toast.error('Enter rejection reason')
    setWithdrawals(prev => {
      const updated = prev.map(w => w.id === rejectModal.id ? { ...w, status: 'rejected', rejectNote } : w)
      try {
        localStorage.setItem('serviceq_provider_withdrawals', JSON.stringify(updated))
        window.dispatchEvent(new Event('serviceq_withdrawals_updated'))
        window.dispatchEvent(new Event('storage'))
      } catch {}
      return updated
    })
    toast.error('Withdrawal rejected')
    setRejectModal(null); setRejectNote('')
  }

  const handleTxnFilterChange = (val) => { setTxnFilter(val); setPage(1) }

  const filtered = txnFilter === 'all' ? transactions : transactions.filter(t => t.status === txnFilter)
  const displayedTxns = isDefaultAll ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filtered

  const txnTabs = [
    { id: 'ledger',      label: 'Transaction Ledger' },
    { id: 'withdrawals', label: `Withdrawal Queue (${withdrawals.filter(w => w.status !== 'completed' && w.status !== 'rejected').length})` },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
        <p className="text-xs text-gray-400 mt-0.5">Transaction ledger and payout management</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Successful" value={formatPHP(transactions.filter(t => t.status === 'successful').reduce((s, t) => s + t.gross, 0))} icon={CheckCircle} color="success" />
        <StatCard label="Pending"          value={formatPHP(transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.gross, 0))}   icon={Clock}        color="warning" />
        <StatCard label="Refunded"         value={formatPHP(transactions.filter(t => t.status === 'refunded').reduce((s, t) => s + t.gross, 0))}  icon={AlertCircle}  color="danger" />
        <StatCard label="Platform Revenue" value={formatPHP(transactions.filter(t => t.status === 'successful').reduce((s, t) => s + t.fee, 0))}  icon={DollarSign}   color="brand" />
      </div>

      <Tabs tabs={txnTabs} active={tab} onChange={setTab} />

      {/* Transaction Ledger */}
      {tab === 'ledger' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
            <select value={txnFilter} onChange={e => handleTxnFilterChange(e.target.value)} className="input w-auto text-sm">
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
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100 bg-gray-50">
                  <th className="p-4 font-semibold">Txn ID</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Provider</th>
                  <th className="p-4 font-semibold">Service</th>
                  <th className="p-4 font-semibold">Gross</th>
                  <th className="p-4 font-semibold">Fee</th>
                  <th className="p-4 font-semibold">Net</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedTxns.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-500 font-semibold">{t.id}</td>
                    <td className="p-4 font-medium text-gray-900">{t.customer}</td>
                    <td className="p-4 text-gray-500 text-sm">{t.provider}</td>
                    <td className="p-4 text-gray-500 text-sm">{t.service}</td>
                    <td className="p-4 text-gray-700 font-medium">{formatPHP(t.gross)}</td>
                    <td className="p-4 text-rose-500 text-sm">{formatPHP(t.fee)}</td>
                    <td className="p-4 font-bold text-brand-600">{formatPHP(t.net)}</td>
                    <td className="p-4 text-gray-400 text-xs">{t.date}</td>
                    <td className="p-4">
                      <Badge variant={statusVariant(t.status)} className="capitalize">{t.status}</Badge>
                    </td>
                    <td className="p-4">
                      {t.status === 'successful' && (
                        <button
                          onClick={() => issueRefund(t.id)}
                          className="btn-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg px-2 py-1 text-xs font-medium"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isDefaultAll && filtered.length > PAGE_SIZE && (
              <div className="p-4 border-t border-gray-100">
                <Pagination currentPage={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdrawal Queue */}
      {tab === 'withdrawals' && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-100 bg-gray-50">
                <th className="p-4 font-semibold">Request ID</th>
                <th className="p-4 font-semibold">Provider</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Requested</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {withdrawals.map(w => {
                const next = nextStatus(w.status)
                const actionLabel = { pending_review: 'Verify', verified: 'Approve', approved: 'Process', processing: 'Complete' }[w.status]
                return (
                  <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-500 font-semibold">{w.id}</td>
                    <td className="p-4 font-medium text-gray-900">{w.provider}</td>
                    <td className="p-4 text-gray-500 text-sm">{w.method}</td>
                    <td className="p-4 font-bold text-brand-600">{formatPHP(w.amount)}</td>
                    <td className="p-4 text-gray-400 text-xs">{w.requested}</td>
                    <td className="p-4">
                      <Badge variant={wdVariant(w.status)} className="capitalize">{w.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center">
                        {w.status !== 'completed' && w.status !== 'rejected' && (
                          <button
                            onClick={() => approveWithdrawal(w.id)}
                            className="btn-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs"
                          >
                            Approve
                          </button>
                        )}
                        {next && actionLabel && w.status !== 'completed' && (
                          <button
                            onClick={() => advanceWd(w.id, next)}
                            className="btn-sm bg-brand-100 text-brand-700 hover:bg-brand-200 rounded-lg px-2 py-1 text-xs font-medium"
                          >
                            {actionLabel}
                          </button>
                        )}
                        {w.status !== 'completed' && w.status !== 'rejected' && (
                          <button
                            onClick={() => setRejectModal(w)}
                            className="btn-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg px-2 py-1 text-xs font-medium"
                          >
                            Reject
                          </button>
                        )}
                        {w.status === 'completed' && (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Paid Out
                          </span>
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
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Withdrawal Request" size="sm">
        <div className="flex flex-col gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
            Rejecting <span className="font-bold">{formatPHP(rejectModal?.amount ?? 0)}</span> withdrawal from <span className="font-bold">{rejectModal?.provider}</span>
          </div>
          <div className="form-group">
            <label className="label">Rejection Reason</label>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="Explain why this withdrawal is rejected..."
              className="input resize-none"
            />
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

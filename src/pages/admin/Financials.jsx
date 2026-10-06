import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { formatPHP, statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import { DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react'

import {
  fetchBackendWithdrawals,
  approveWithdrawalBackend,
  rejectWithdrawalBackend,
  advanceWithdrawalBackend,
  fetchBackendTransactions
} from '@/lib/bookingsService'

const WITHDRAWAL_FLOW = ['pending_review', 'verified', 'approved', 'processing', 'completed']
const wdVariant = s => ({ pending_review: 'warning', verified: 'info', approved: 'brand', processing: 'info', completed: 'success', rejected: 'danger' }[s] ?? 'neutral')

export default function AdminFinancials() {
  const [tab, setTab] = useState('ledger')
  const [page, setPage] = useState(1)

  const loadTransactionsLocal = () => {
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
      return merged
        .filter(b => b && b.id && !/^TXN-00\d$/.test(b.id))
        .map(b => ({
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
    } catch {}
    return []
  }

  const loadWithdrawalsLocal = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('serviceq_provider_withdrawals'))
      if (Array.isArray(stored)) {
        return stored.filter(w => w && w.id && !/^WD-00[1-6]$/.test(w.id))
      }
    } catch {}
    return []
  }

  const [transactions, setTransactions] = useState(loadTransactionsLocal)
  const [withdrawals, setWithdrawals] = useState(loadWithdrawalsLocal)
  const [txnFilter, setTxnFilter] = useState('all')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectNote, setRejectNote] = useState('')

  // Live real-time sync with Supabase backend and localStorage
  useEffect(() => {
    const syncData = async () => {
      try {
        // Transactions from backend
        const txns = await fetchBackendTransactions()
        if (Array.isArray(txns)) {
          setTransactions(txns.filter(t => !/^TXN-00\d$/.test(t.id)))
        } else {
          setTransactions(loadTransactionsLocal())
        }

        // Withdrawals from backend
        const wds = await fetchBackendWithdrawals()
        if (Array.isArray(wds)) {
          setWithdrawals(wds.filter(w => !/^WD-00[1-6]$/.test(w.id)))
        } else {
          setWithdrawals(loadWithdrawalsLocal())
        }
      } catch (err) {
        console.warn('Financials live sync error:', err)
      }
    }

    syncData()

    window.addEventListener('serviceq_withdrawals_updated', syncData)
    window.addEventListener('serviceq_bookings_updated', syncData)
    window.addEventListener('storage', syncData)

    let bcW = null
    let bcB = null
    try {
      bcW = new BroadcastChannel('serviceq_withdrawals')
      bcW.onmessage = syncData
      bcB = new BroadcastChannel('serviceq_bookings')
      bcB.onmessage = syncData
    } catch {}

    const poll = setInterval(syncData, 3500)

    return () => {
      clearInterval(poll)
      window.removeEventListener('serviceq_withdrawals_updated', syncData)
      window.removeEventListener('serviceq_bookings_updated', syncData)
      window.removeEventListener('storage', syncData)
      if (bcW) bcW.close()
      if (bcB) bcB.close()
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

  const advanceWd = async (id, status) => {
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status } : w))
    await advanceWithdrawalBackend(id, status)
    toast.success(`Status updated to: ${status.replace('_', ' ')}`)
  }

  const approveWithdrawal = async (id) => {
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'completed', approved_at: new Date().toISOString() } : w))
    await approveWithdrawalBackend(id, 'Admin')
    toast.success('Withdrawal approved and marked as paid out!')
  }

  const rejectWd = async () => {
    if (!rejectNote.trim()) return toast.error('Enter rejection reason')
    const targetId = rejectModal.id
    setWithdrawals(prev => prev.map(w => w.id === targetId ? { ...w, status: 'rejected', rejectNote } : w))
    await rejectWithdrawalBackend(targetId, rejectNote, 'Admin')
    toast.error('Withdrawal rejected')
    setRejectModal(null)
    setRejectNote('')
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
                {displayedTxns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-14 text-center text-gray-400">
                      <p className="text-3xl mb-2">📊</p>
                      <p className="font-semibold text-gray-600 text-sm">No transactions yet</p>
                      <p className="text-xs text-gray-400 mt-1">Completed customer bookings will appear here automatically.</p>
                    </td>
                  </tr>
                ) : displayedTxns.map(t => (
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
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-14 text-center text-gray-400">
                    <p className="text-3xl mb-2">💸</p>
                    <p className="font-semibold text-gray-600 text-sm">No withdrawal requests</p>
                    <p className="text-xs text-gray-400 mt-1">When providers submit withdrawal requests, they will appear here.</p>
                  </td>
                </tr>
              ) : withdrawals.map(w => {
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

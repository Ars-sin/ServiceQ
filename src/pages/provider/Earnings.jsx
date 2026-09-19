import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Wallet, Clock, ArrowDownRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { useAuth } from '@/contexts/AuthContext'

const TXNS = [
  { id: 'SQ-A1', customer: 'Ana Reyes',   service: 'Home Cleaning',  gross: 1100, fee: 110, net: 990,  date: '2026-09-05', payout: 'released' },
  { id: 'SQ-B2', customer: 'Marco Lopez', service: 'Home Cleaning',  gross: 550,  fee: 55,  net: 495,  date: '2026-09-03', payout: 'released' },
  { id: 'SQ-C3', customer: 'Grace Tan',   service: 'Deep Cleaning',  gross: 1320, fee: 132, net: 1188, date: '2026-09-01', payout: 'pending'  },
  { id: 'SQ-D4', customer: 'Rico Santos', service: 'Home Cleaning',  gross: 880,  fee: 88,  net: 792,  date: '2026-08-29', payout: 'released' },
  { id: 'SQ-E5', customer: 'Joy DC',      service: 'Office Cleaning',gross: 880,  fee: 88,  net: 792,  date: '2026-08-25', payout: 'pending'  },
]

const INITIAL_WITHDRAWALS = [
  { id: 'WD-001', provider: 'Maria Santos', method: 'GCash', amount: 3500, date: '2026-09-06', requested: '2026-09-06', status: 'pending_review' },
  { id: 'WD-004', provider: 'Maria Santos', method: 'GCash', amount: 2100, date: '2026-09-03', requested: '2026-09-03', status: 'completed' },
]

const wdVariant = s => ({
  pending_review: 'warning',
  verified: 'info',
  approved: 'brand',
  processing: 'info',
  completed: 'success',
  rejected: 'danger'
}[s] ?? 'neutral')

export default function ProviderEarnings() {
  const { profile } = useAuth()
  const [tab, setTab]                   = useState('transactions')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [wAmount, setWAmount]           = useState('')
  const [wMethod, setWMethod]           = useState('gcash')

  // Persistent Available Balance
  const [availBalance, setAvailBalance] = useState(() => {
    try {
      const stored = localStorage.getItem('serviceq_provider_avail_balance')
      if (stored !== null && !isNaN(Number(stored))) return Number(stored)
    } catch {}
    return 3177
  })

  // Persistent Pending Balance
  const [pendingBalance, setPendingBalance] = useState(() => {
    try {
      const stored = localStorage.getItem('serviceq_provider_pending_balance')
      if (stored !== null && !isNaN(Number(stored))) return Number(stored)
    } catch {}
    return 1980
  })

  // Persistent Withdrawals List
  const [withdrawals, setWithdrawals] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('serviceq_provider_withdrawals'))
      if (Array.isArray(stored) && stored.length > 0) return stored
    } catch {}
    return INITIAL_WITHDRAWALS
  })

  // Sync state if updated from other components or tabs
  useEffect(() => {
    const handleSync = () => {
      try {
        const storedW = JSON.parse(localStorage.getItem('serviceq_provider_withdrawals'))
        if (Array.isArray(storedW)) setWithdrawals(storedW)
        const storedAvail = localStorage.getItem('serviceq_provider_avail_balance')
        if (storedAvail !== null && !isNaN(Number(storedAvail))) setAvailBalance(Number(storedAvail))
        const storedPend = localStorage.getItem('serviceq_provider_pending_balance')
        if (storedPend !== null && !isNaN(Number(storedPend))) setPendingBalance(Number(storedPend))
      } catch {}
    }
    window.addEventListener('storage', handleSync)
    window.addEventListener('serviceq_withdrawals_updated', handleSync)
    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('serviceq_withdrawals_updated', handleSync)
    }
  }, [])

  const handleWithdraw = () => {
    const amount = Number(wAmount)
    if (!amount || amount <= 0) return toast.error('Please enter a valid amount')
    if (amount > availBalance) return toast.error(`Max available: ${formatPHP(availBalance)}`)

    const newAvail = availBalance - amount
    const newPending = pendingBalance + amount
    setAvailBalance(newAvail)
    setPendingBalance(newPending)

    try {
      localStorage.setItem('serviceq_provider_avail_balance', String(newAvail))
      localStorage.setItem('serviceq_provider_pending_balance', String(newPending))
    } catch {}

    const newWd = {
      id: 'WD-' + Date.now().toString(36).toUpperCase().slice(-5),
      provider: profile?.full_name || 'Maria Santos',
      method: wMethod === 'gcash' ? 'GCash' : wMethod === 'maya' ? 'Maya' : 'Bank Transfer',
      amount,
      date: new Date().toISOString().split('T')[0],
      requested: new Date().toISOString().split('T')[0],
      status: 'pending_review',
    }

    const updated = [newWd, ...withdrawals]
    setWithdrawals(updated)

    try {
      localStorage.setItem('serviceq_provider_withdrawals', JSON.stringify(updated))
    } catch {}

    window.dispatchEvent(new Event('serviceq_withdrawals_updated'))

    toast.success(`Withdrawal of ${formatPHP(amount)} submitted! Pending admin review.`)
    setShowWithdraw(false)
    setWAmount('')
    setTab('withdrawals')
  }

  const TABS = [
    { id: 'transactions', label: 'Transaction History' },
    { id: 'withdrawals',  label: `Withdrawal Requests (${withdrawals.length})` },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings & Payouts</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track your bookings revenue and withdrawal payout history</p>
        </div>
        <button
          onClick={() => setShowWithdraw(true)}
          className="btn-primary gap-2 self-start sm:self-auto"
          style={{ background: '#059669' }}
        >
          <Wallet size={16} /> Request Withdrawal
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Gross Revenue"     value={formatPHP(24800)}          icon={TrendingUp}   color="success" />
        <StatCard label="Platform Fees"     value={formatPHP(2480)}           icon={DollarSign}   color="danger" />
        <StatCard label="Net Revenue"       value={formatPHP(22320)}          icon={DollarSign}   color="brand" />
        <StatCard label="Available Balance" value={formatPHP(availBalance)}   icon={Wallet}       color="success" />
        <StatCard label="Pending Balance"   value={formatPHP(pendingBalance)} icon={Clock}        color="warning" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── Tab: Transactions ─────────────────────────────────────── */}
      {tab === 'transactions' && (
        <div className="card overflow-x-auto p-0 border border-gray-200/80 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">Completed Booking Payouts</h2>
            <span className="text-xs text-gray-400">Showing recent 5 bookings</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-100 bg-gray-50/50">
                <th className="p-4 font-medium">Booking ID</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Service</th>
                <th className="p-4 font-medium">Gross</th>
                <th className="p-4 font-medium">Fee (10%)</th>
                <th className="p-4 font-medium">Net</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {TXNS.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-4 font-mono text-xs text-gray-500 font-semibold">{t.id}</td>
                  <td className="p-4 font-medium text-gray-900">{t.customer}</td>
                  <td className="p-4 text-gray-600">{t.service}</td>
                  <td className="p-4">{formatPHP(t.gross)}</td>
                  <td className="p-4 text-red-500 font-medium">−{formatPHP(t.fee)}</td>
                  <td className="p-4 font-bold text-brand-600">{formatPHP(t.net)}</td>
                  <td className="p-4 text-gray-400 text-xs">{t.date}</td>
                  <td className="p-4">
                    <Badge variant={t.payout === 'released' ? 'success' : 'warning'} className="capitalize">
                      {t.payout}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Withdrawals ──────────────────────────────────────── */}
      {tab === 'withdrawals' && (
        <div className="card overflow-x-auto p-0 border border-gray-200/80 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">Withdrawal Payout Requests</h2>
            <button
              onClick={() => setShowWithdraw(true)}
              className="btn-secondary btn-sm text-xs gap-1.5"
            >
              <Wallet size={13} /> New Withdrawal
            </button>
          </div>
          {withdrawals.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="font-semibold text-gray-700">No withdrawal requests yet</p>
              <p className="text-xs text-gray-400 mt-1">Submit a request to transfer your available earnings.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100 bg-gray-50/50">
                  <th className="p-4 font-medium">Request ID</th>
                  <th className="p-4 font-medium">Requested Date</th>
                  <th className="p-4 font-medium">Payout Method</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {withdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-500 font-semibold">{w.id}</td>
                    <td className="p-4 text-gray-600 text-xs">{w.date || w.requested}</td>
                    <td className="p-4 font-medium text-gray-900">{w.method}</td>
                    <td className="p-4 font-bold text-emerald-700">{formatPHP(w.amount)}</td>
                    <td className="p-4">
                      <Badge variant={wdVariant(w.status)} className="capitalize text-xs font-semibold">
                        {w.status ? w.status.replace('_', ' ') : 'Pending'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Withdrawal Modal */}
      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title="Request Payout Withdrawal">
        <div className="flex flex-col gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-sm text-emerald-800 flex items-center justify-between">
            <span>Available to Withdraw:</span>
            <strong className="text-base font-extrabold text-emerald-900">{formatPHP(availBalance)}</strong>
          </div>

          <div className="form-group">
            <label className="label">Payout Destination Method</label>
            <div className="flex gap-2">
              {[
                { id: 'gcash', l: '💚 GCash' },
                { id: 'maya',  l: '💙 Maya' },
                { id: 'bank',  l: '🏦 Bank' }
              ].map(m => (
                <label
                  key={m.id}
                  className={`flex-1 p-2.5 border-2 rounded-xl text-xs font-semibold text-center cursor-pointer transition-all ${
                    wMethod === m.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="wm"
                    value={m.id}
                    checked={wMethod === m.id}
                    onChange={() => setWMethod(m.id)}
                    className="hidden"
                  />
                  {m.l}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Withdrawal Amount (₱)</label>
            <input
              type="number"
              value={wAmount}
              onChange={e => setWAmount(e.target.value)}
              placeholder={`Max: ${formatPHP(availBalance)}`}
              className="input font-semibold text-base"
              max={availBalance}
              min="100"
            />
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
              <span>Min: ₱100.00</span>
              <button
                type="button"
                onClick={() => setWAmount(String(availBalance))}
                className="text-emerald-700 font-bold hover:underline"
              >
                Withdraw Max
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 border border-gray-100">
            Payout requests are verified and processed by Admin within 24 hours. The requested amount will be deducted from your available balance immediately.
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowWithdraw(false)}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              className="btn-primary text-xs font-bold px-5"
              style={{ background: '#059669' }}
            >
              Confirm Withdrawal
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

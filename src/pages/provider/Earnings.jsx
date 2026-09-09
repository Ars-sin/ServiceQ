import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Wallet, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, statusVariant } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

const TXNS = [
  { id: 'SQ-A1', customer: 'Ana Reyes',   service: 'Home Cleaning',  gross: 1100, fee: 110, net: 990,  date: '2026-09-05', payout: 'released' },
  { id: 'SQ-B2', customer: 'Marco Lopez', service: 'Home Cleaning',  gross: 550,  fee: 55,  net: 495,  date: '2026-09-03', payout: 'released' },
  { id: 'SQ-C3', customer: 'Grace Tan',   service: 'Deep Cleaning',  gross: 1320, fee: 132, net: 1188, date: '2026-09-01', payout: 'pending'  },
  { id: 'SQ-D4', customer: 'Rico Santos', service: 'Home Cleaning',  gross: 880,  fee: 88,  net: 792,  date: '2026-08-29', payout: 'released' },
  { id: 'SQ-E5', customer: 'Joy DC',      service: 'Office Cleaning',gross: 880,  fee: 88,  net: 792,  date: '2026-08-25', payout: 'pending'  },
]

export default function ProviderEarnings() {
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [wAmount, setWAmount]           = useState('')
  const [wMethod, setWMethod]           = useState('gcash')

  const AVAIL = 3177 // mock available balance

  const handleWithdraw = () => {
    if (!wAmount || +wAmount <= 0) return toast.error('Enter a valid amount')
    if (+wAmount > AVAIL) return toast.error(`Max available: ${formatPHP(AVAIL)}`)
    toast.success('Withdrawal request submitted! Pending review.')
    setShowWithdraw(false)
    setWAmount('')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Earnings & Payouts</h1>
        <button onClick={() => setShowWithdraw(true)} className="btn-primary gap-2" style={{ background: '#059669' }}>
          <Wallet size={16} /> Request Withdrawal
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Gross Revenue"   value={formatPHP(24800)} icon={TrendingUp}   color="success" />
        <StatCard label="Platform Fees"   value={formatPHP(2480)}  icon={DollarSign}   color="danger" />
        <StatCard label="Net Revenue"     value={formatPHP(22320)} icon={DollarSign}   color="brand" />
        <StatCard label="Available Balance" value={formatPHP(AVAIL)} icon={Wallet}     color="success" />
        <StatCard label="Pending Balance" value={formatPHP(1980)}  icon={Clock}        color="warning" />
      </div>

      {/* Transactions */}
      <div className="card overflow-x-auto p-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Transaction History</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
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
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-xs text-gray-500">{t.id}</td>
                <td className="p-4 font-medium text-gray-900">{t.customer}</td>
                <td className="p-4 text-gray-600">{t.service}</td>
                <td className="p-4">{formatPHP(t.gross)}</td>
                <td className="p-4 text-red-500">−{formatPHP(t.fee)}</td>
                <td className="p-4 font-bold text-brand-600">{formatPHP(t.net)}</td>
                <td className="p-4 text-gray-400">{t.date}</td>
                <td className="p-4"><Badge variant={t.payout === 'released' ? 'success' : 'warning'} className="capitalize">{t.payout}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Withdrawal Modal */}
      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title="Request Withdrawal">
        <div className="flex flex-col gap-4">
          <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700">
            Available Balance: <strong>{formatPHP(AVAIL)}</strong>
          </div>
          <div className="form-group">
            <label className="label">Payout Method</label>
            <div className="flex gap-2">
              {[{ id: 'gcash', l: '💚 GCash' }, { id: 'maya', l: '💙 Maya' }, { id: 'bank', l: '🏦 Bank' }].map(m => (
                <label key={m.id} className={`flex-1 p-2.5 border-2 rounded-xl text-xs font-medium text-center cursor-pointer transition-all ${wMethod === m.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="wm" value={m.id} checked={wMethod === m.id} onChange={() => setWMethod(m.id)} className="hidden" />{m.l}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="label">Amount</label>
            <input type="number" value={wAmount} onChange={e => setWAmount(e.target.value)}
              placeholder={`Max ${formatPHP(AVAIL)}`} className="input" />
          </div>
          <button onClick={handleWithdraw} className="btn-primary w-full" style={{ background: '#059669' }}>Submit Request</button>
        </div>
      </Modal>
    </motion.div>
  )
}

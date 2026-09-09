import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Printer, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, calcFees, genBookingId } from '@/lib/utils'
import { PAYMENT_METHODS } from '@/lib/constants'
import Modal from '@/components/ui/Modal'

const MOCK_ORDER = { title: 'Professional Home Cleaning Service', date: '2026-09-10', sessions: 2, price: 500 }

export default function Checkout() {
  const [method, setMethod] = useState('gcash')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [bookingId] = useState(genBookingId())

  const { subtotal, fee, total } = calcFees(MOCK_ORDER.price * MOCK_ORDER.sessions)

  const handlePay = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setConfirmed(true)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="card flex flex-col gap-4">
          <h2 className="font-bold text-gray-900">Order Summary</h2>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-gray-900">{MOCK_ORDER.title}</p>
            <p className="text-sm text-gray-500 mt-1">📅 Date: {MOCK_ORDER.date}</p>
            <p className="text-sm text-gray-500">🔁 Sessions: {MOCK_ORDER.sessions}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPHP(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Platform Fee (10%)</span><span>{formatPHP(fee)}</span></div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
              <span>Grand Total</span><span className="text-brand-600">{formatPHP(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="card flex flex-col gap-4">
          <h2 className="font-bold text-gray-900">Payment Method</h2>
          <div className="flex flex-col gap-2">
            {PAYMENT_METHODS.map(pm => (
              <label key={pm.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  method === pm.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <input type="radio" name="payment" value={pm.id} checked={method === pm.id}
                  onChange={() => setMethod(pm.id)} className="accent-brand-600" />
                <span className="text-xl">{pm.icon}</span>
                <span className="font-medium text-sm">{pm.label}</span>
              </label>
            ))}
          </div>

          {/* Mock QR for e-wallets */}
          {['gcash', 'maya'].includes(method) && (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="w-28 h-28 bg-gray-200 rounded-xl mx-auto flex items-center justify-center mb-2">
                <span className="text-xs text-gray-400">QR Code</span>
              </div>
              <p className="text-xs text-gray-500">Scan with {method === 'gcash' ? 'GCash' : 'Maya'} app</p>
              <p className="text-xs text-gray-500">Amount: <strong>{formatPHP(total)}</strong></p>
            </div>
          )}

          <button onClick={handlePay} disabled={loading} className="btn-primary btn-lg w-full">
            {loading
              ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : `Confirm & Pay ${formatPHP(total)}`}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal open={confirmed} onClose={() => setConfirmed(false)} title="Booking Confirmed! 🎉" size="md">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={36} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Booking ID</p>
            <p className="text-xl font-bold text-gray-900 font-mono">{bookingId}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 w-full text-left text-sm flex flex-col gap-1">
            <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{MOCK_ORDER.title}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{MOCK_ORDER.date}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{method}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Paid</span><span className="font-bold text-brand-600">{formatPHP(total)}</span></div>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={() => toast('Receipt downloaded!')} className="btn-secondary flex-1 gap-2">
              <Download size={16} /> Download Receipt
            </button>
            <button onClick={() => toast('Opening print preview...')} className="btn-ghost flex-1 gap-2">
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

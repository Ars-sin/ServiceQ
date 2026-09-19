import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { CheckCircle, Printer, Download, ArrowRight, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, calcFees, genBookingId } from '@/lib/utils'
import { PAYMENT_METHODS } from '@/lib/constants'
import Modal from '@/components/ui/Modal'
import { ALL_LISTINGS } from '@/pages/customer/Explore'

const DEFAULT_ORDER = {
  id: '1',
  title: 'Professional Home Cleaning Service',
  provider: 'Maria Santos',
  date: new Date().toISOString().split('T')[0],
  sessions: 1,
  price: 500,
}

export default function Checkout() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  const [method, setMethod] = useState('gcash')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [bookingId] = useState(genBookingId())

  // Resolve order details from location state, sessionStorage, or ALL_LISTINGS fallback
  const order = useMemo(() => {
    if (location.state && location.state.title) {
      return location.state
    }

    try {
      const saved = JSON.parse(sessionStorage.getItem('serviceq_current_order'))
      if (saved && String(saved.id) === String(id)) {
        return saved
      }
    } catch {}

    const matched = ALL_LISTINGS.find(l => String(l.id) === String(id))
    if (matched) {
      return {
        id: matched.id,
        title: matched.title,
        provider: matched.provider,
        date: new Date().toISOString().split('T')[0],
        sessions: 1,
        price: matched.price,
      }
    }

    return DEFAULT_ORDER
  }, [id, location.state])

  const sessions = order.sessions || 1
  const price = order.price || 500
  const subtotal = order.subtotal || price * sessions
  const { fee, total } = calcFees(subtotal)

  const handlePay = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)

    // Save newly booked item to local bookings store for immediate display in My Bookings
    try {
      const existing = JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || []
      const newBooking = {
        id: bookingId,
        service: order.title,
        provider: order.provider || 'Verified Provider',
        date: order.date || new Date().toISOString().split('T')[0],
        amount: total,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('serviceq_customer_bookings', JSON.stringify([newBooking, ...existing]))
    } catch (e) {
      console.warn('Local booking cache error:', e)
    }

    setConfirmed(true)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Secure Checkout</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete your reservation securely via ServiceQ Escrow</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-xs text-gray-500 hover:text-gray-700">
          Cancel & Return
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={18} className="text-brand-600" /> Order Summary
          </h2>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-1.5">
            <p className="font-bold text-gray-900 text-sm">{order.title}</p>
            <p className="text-xs text-gray-600">Provider: <span className="font-medium text-gray-800">{order.provider}</span></p>
            <p className="text-xs text-gray-600">📅 Scheduled Date: <span className="font-medium text-gray-800">{order.date}</span></p>
            <p className="text-xs text-gray-600">🔁 Quantity / Sessions: <span className="font-medium text-gray-800">{sessions}</span></p>
          </div>

          <div className="flex flex-col gap-2 text-sm pt-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({sessions} × {formatPHP(price)})</span>
              <span>{formatPHP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>ServiceQ Platform Fee (10%)</span>
              <span>{formatPHP(fee)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
              <span className="text-gray-900">Total Amount Due</span>
              <span className="text-brand-600 text-lg">{formatPHP(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
          <h2 className="font-bold text-gray-900">Select Payment Method</h2>
          <div className="flex flex-col gap-2">
            {PAYMENT_METHODS.map(pm => (
              <label key={pm.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  method === pm.id ? 'border-brand-500 bg-brand-50/70' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <input type="radio" name="payment" value={pm.id} checked={method === pm.id}
                  onChange={() => setMethod(pm.id)} className="accent-brand-600" />
                <span className="text-xl">{pm.icon}</span>
                <span className="font-medium text-sm text-gray-900">{pm.label}</span>
              </label>
            ))}
          </div>

          {/* QR mock for e-wallets */}
          {['gcash', 'maya'].includes(method) && (
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <div className="w-28 h-28 bg-white border border-gray-200 rounded-xl mx-auto flex items-center justify-center mb-2 shadow-inner">
                <span className="text-xs text-gray-400 font-mono">ServiceQ QR</span>
              </div>
              <p className="text-xs text-gray-600">Scan using your {method === 'gcash' ? 'GCash' : 'Maya'} mobile app</p>
              <p className="text-xs text-gray-500 mt-0.5">Amount: <strong className="text-gray-900 font-bold">{formatPHP(total)}</strong></p>
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading}
            className="btn-primary btn-lg w-full font-bold shadow-sm mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Payment...
              </span>
            ) : (
              `Confirm & Pay ${formatPHP(total)}`
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal open={confirmed} onClose={() => {}} title="Booking Confirmed! 🎉" size="md">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle size={36} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Reference ID</p>
            <p className="text-xl font-black text-gray-900 font-mono mt-0.5">{bookingId}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 w-full text-left text-sm flex flex-col gap-2 border border-gray-100">
            <div className="flex justify-between"><span className="text-gray-500">Service:</span><span className="font-semibold text-gray-900">{order.title}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Provider:</span><span className="font-medium text-gray-800">{order.provider}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Scheduled Date:</span><span>{order.date}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment Channel:</span><span className="capitalize font-medium">{method}</span></div>
            <div className="border-t border-gray-200/70 pt-2 flex justify-between font-bold"><span className="text-gray-900">Total Paid:</span><span className="text-brand-600">{formatPHP(total)}</span></div>
          </div>

          <div className="flex flex-col gap-2 w-full pt-1">
            <button
              onClick={() => navigate('/customer/bookings')}
              className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              Go to My Bookings <ArrowRight size={16} />
            </button>

            <div className="flex gap-2 w-full">
              <button onClick={() => toast.success('Receipt downloaded to downloads folder!')} className="btn-secondary flex-1 text-xs gap-1.5 py-2">
                <Download size={14} /> Download Receipt
              </button>
              <button onClick={() => window.print()} className="btn-ghost flex-1 text-xs gap-1.5 py-2">
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

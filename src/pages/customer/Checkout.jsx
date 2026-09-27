import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { CheckCircle, Printer, Download, ArrowRight, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, calcFees, genBookingId } from '@/lib/utils'
import { PAYMENT_METHODS } from '@/lib/constants'
import Modal from '@/components/ui/Modal'
import { ALL_LISTINGS } from '@/pages/customer/Explore'
import { loadCachedListings } from '@/lib/listingsService'
import { useAuth } from '@/contexts/AuthContext'

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
  const { user, profile } = useAuth()
  const { id } = useParams()
  const location = useLocation()

  const [method, setMethod] = useState('')
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

    const matched = loadCachedListings().find(l => String(l.id) === String(id))
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
    if (!method) return toast.error('Please select a payment method')
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)

    // Save newly booked item to local bookings store for immediate display in My Bookings
    try {
      const existing = JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || []
      const customerName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer'
      const newBooking = {
        id: bookingId,
        listingId: String(order.id || id),           // track which listing was booked
        service: order.title,
        provider: order.provider || 'Verified Provider',
        providerId: order.providerId || null,
        customer: customerName,
        customerEmail: user?.email || null,
        customerId: user?.id || null,
        date: order.date || new Date().toISOString().split('T')[0],
        sessions: order.sessions || sessions,
        subtotal: order.subtotal || subtotal,
        fee: order.fee || fee,
        amount: total,
        net: (order.subtotal || subtotal),
        status: 'pending',
        paymentMethod: method,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('serviceq_customer_bookings', JSON.stringify([newBooking, ...existing]))

      // ── Increment booking counter on the listing ──────────────────
      try {
        const listingId = String(order.id || id)
        // Update in custom listings store
        const customListings = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
        const updatedCustom = customListings.map(l =>
          String(l.id) === listingId ? { ...l, bookings: (Number(l.bookings) || 0) + 1 } : l
        )
        localStorage.setItem('serviceq_custom_listings', JSON.stringify(updatedCustom))

        // Update in provider-scoped listings (if providerId known)
        if (order.providerId) {
          const provKey = `serviceq_provider_listings_${order.providerId}`
          const provListings = JSON.parse(localStorage.getItem(provKey)) || []
          const updatedProv = provListings.map(l =>
            String(l.id) === listingId ? { ...l, bookings: (Number(l.bookings) || 0) + 1 } : l
          )
          localStorage.setItem(provKey, JSON.stringify(updatedProv))
        }

        // Persist to a booking-count store keyed by listingId for resilience
        const countKey = `serviceq_listing_bookings_${listingId}`
        const prevCount = Number(localStorage.getItem(countKey) || 0)
        localStorage.setItem(countKey, String(prevCount + 1))

        window.dispatchEvent(new Event('serviceq_listings_updated'))
      } catch {}



      // Save to global all bookings store
      const allBookings = JSON.parse(localStorage.getItem('serviceq_all_bookings')) || []
      localStorage.setItem('serviceq_all_bookings', JSON.stringify([newBooking, ...allBookings.filter(b => b.id !== bookingId)]))

      // Save directly to the specific provider's bookings (by providerId UUID)
      if (order.providerId) {
        const provBookings = JSON.parse(localStorage.getItem(`serviceq_provider_bookings_${order.providerId}`)) || []
        localStorage.setItem(`serviceq_provider_bookings_${order.providerId}`, JSON.stringify([newBooking, ...provBookings.filter(b => b.id !== bookingId)]))
      }

      // Save to provider-name keyed bucket as fallback (for providers who matched by name)
      if (order.provider) {
        const nameKey = `serviceq_provider_bookings_name_${order.provider.trim().toLowerCase().replace(/\s+/g, '_')}`
        const nameBookings = JSON.parse(localStorage.getItem(nameKey)) || []
        localStorage.setItem(nameKey, JSON.stringify([newBooking, ...nameBookings.filter(b => b.id !== bookingId)]))
      }

      // Also save to generic provider bookings for demo resilience
      const genProvBookings = JSON.parse(localStorage.getItem('serviceq_provider_bookings')) || []
      localStorage.setItem('serviceq_provider_bookings', JSON.stringify([newBooking, ...genProvBookings.filter(b => b.id !== bookingId)]))

      // Audit log entry for real-time admin view
      const auditLog = JSON.parse(localStorage.getItem('serviceq_audit_log')) || []
      const auditEntry = {
        id: `a${Date.now()}`,
        staff: 'Customer Escrow',
        role: 'customer',
        action: 'Booking Created & Paid',
        target: `${bookingId} (${order.title})`,
        desc: `${customerName} paid ₱${total.toLocaleString()} for "${order.title}" via ${method.toUpperCase()}. Escrow held — awaiting provider acceptance.`,
        before: { status: 'none' },
        after: { status: 'pending' },
        ip: '127.0.0.1',
        ts: new Date().toISOString(),
      }
      localStorage.setItem('serviceq_audit_log', JSON.stringify([auditEntry, ...auditLog]))

      window.dispatchEvent(new Event('serviceq_bookings_updated'))
      window.dispatchEvent(new Event('storage'))

      // ── Broadcast to provider tab immediately (cross-tab) ──
      try {
        const bc = new BroadcastChannel('serviceq_bookings')
        bc.postMessage({ event: 'new_booking', bookingId, service: order.title })
        bc.close()
      } catch {}

    } catch (e) {
      console.warn('Local booking cache error:', e)
    }

    setConfirmed(true)
  }

  const handleDownloadReceipt = () => {
    const channelName = PAYMENT_METHODS.find(p => p.id === method)?.label || (method ? method.toUpperCase() : 'GCash')

    // Build a clean HTML receipt for PDF-quality printing
    const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ServiceQ Receipt – ${bookingId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Arial', sans-serif; background: #fff; color: #111; padding: 40px; max-width: 480px; margin: auto; }
    .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 22px; font-weight: 900; color: #059669; letter-spacing: 1px; }
    .header p { font-size: 11px; color: #666; margin-top: 4px; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; margin-top: 8px; border: 1px solid #6ee7b7; }
    .ref { text-align: center; margin: 16px 0; }
    .ref .label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
    .ref .value { font-size: 20px; font-weight: 900; font-family: monospace; color: #111; margin-top: 2px; }
    .section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
    .row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; }
    .row .k { color: #6b7280; }
    .row .v { font-weight: 600; color: #111; text-align: right; max-width: 60%; }
    .divider { border: none; border-top: 1px dashed #d1d5db; margin: 8px 0; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; padding-top: 8px; }
    .total-row .v { color: #059669; }
    .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 14px; }
    .paid-stamp { text-align: center; margin: 10px 0; }
    .paid-stamp span { display: inline-block; border: 3px solid #059669; border-radius: 6px; color: #059669; font-size: 24px; font-weight: 900; padding: 2px 18px; letter-spacing: 4px; transform: rotate(-5deg); }
  </style>
</head>
<body>
  <div class="header">
    <h1>ServiceQ</h1>
    <p>Official Booking Receipt</p>
    <span class="badge">PAYMENT CONFIRMED ✓</span>
  </div>
  <div class="ref">
    <div class="label">Reference ID</div>
    <div class="value">${bookingId}</div>
    <div class="label" style="margin-top:4px">${new Date().toLocaleString('en-PH')}</div>
  </div>
  <div class="section">
    <div class="row"><span class="k">Service</span><span class="v">${order.title}</span></div>
    <div class="row"><span class="k">Provider</span><span class="v">${order.provider}</span></div>
    <div class="row"><span class="k">Scheduled Date</span><span class="v">${order.date}</span></div>
    <div class="row"><span class="k">Sessions / Qty</span><span class="v">${sessions}</span></div>
    <div class="row"><span class="k">Payment Channel</span><span class="v">${channelName}</span></div>
    <div class="row"><span class="k">Payment Status</span><span class="v" style="color:#059669">PAID via Escrow</span></div>
  </div>
  <div class="section">
    <div class="row"><span class="k">Subtotal</span><span class="v">PHP ${subtotal.toFixed(2)}</span></div>
    <div class="row"><span class="k">Platform Fee (10%)</span><span class="v">PHP ${fee.toFixed(2)}</span></div>
    <hr class="divider"/>
    <div class="total-row"><span>TOTAL PAID</span><span class="v">PHP ${total.toFixed(2)}</span></div>
  </div>
  <div class="paid-stamp"><span>PAID</span></div>
  <div class="footer">
    <p>Thank you for choosing ServiceQ!</p>
    <p>Trusted Local Services &amp; Rentals in Cebu</p>
    <p style="margin-top:6px">support@serviceq.ph &nbsp;|&nbsp; serviceq.ph</p>
  </div>
</body>
</html>`

    const blob = new Blob([receiptHtml], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ServiceQ-Receipt-${bookingId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Receipt downloaded as PDF!')
  }

  const handlePrintReceipt = () => {
    const channelName = PAYMENT_METHODS.find(p => p.id === method)?.label || (method ? method.toUpperCase() : 'GCash')

    const printWin = window.open('', '_blank', 'width=600,height=800')
    if (!printWin) {
      toast.error('Pop-up blocked. Please allow pop-ups and try again.')
      return
    }

    printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ServiceQ Receipt – ${bookingId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; color: #111; padding: 40px; max-width: 480px; margin: auto; }
    .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 22px; font-weight: 900; color: #059669; letter-spacing: 1px; }
    .header p { font-size: 11px; color: #666; margin-top: 4px; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; margin-top: 8px; border: 1px solid #6ee7b7; }
    .ref { text-align: center; margin: 16px 0; }
    .ref .label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
    .ref .value { font-size: 20px; font-weight: 900; font-family: monospace; color: #111; margin-top: 2px; }
    .section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
    .row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; }
    .row .k { color: #6b7280; }
    .row .v { font-weight: 600; color: #111; text-align: right; max-width: 60%; }
    hr { border: none; border-top: 1px dashed #d1d5db; margin: 8px 0; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; padding-top: 8px; }
    .total-row .v { color: #059669; }
    .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 14px; }
    .paid-stamp { text-align: center; margin: 10px 0; }
    .paid-stamp span { display: inline-block; border: 3px solid #059669; border-radius: 6px; color: #059669; font-size: 24px; font-weight: 900; padding: 2px 18px; letter-spacing: 4px; transform: rotate(-5deg); }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>ServiceQ</h1>
    <p>Official Booking Receipt</p>
    <span class="badge">PAYMENT CONFIRMED ✓</span>
  </div>
  <div class="ref">
    <div class="label">Reference ID</div>
    <div class="value">${bookingId}</div>
    <div class="label" style="margin-top:4px">${new Date().toLocaleString('en-PH')}</div>
  </div>
  <div class="section">
    <div class="row"><span class="k">Service</span><span class="v">${order.title}</span></div>
    <div class="row"><span class="k">Provider</span><span class="v">${order.provider}</span></div>
    <div class="row"><span class="k">Scheduled Date</span><span class="v">${order.date}</span></div>
    <div class="row"><span class="k">Sessions / Qty</span><span class="v">${sessions}</span></div>
    <div class="row"><span class="k">Payment Channel</span><span class="v">${channelName}</span></div>
    <div class="row"><span class="k">Payment Status</span><span class="v" style="color:#059669">PAID via Escrow</span></div>
  </div>
  <div class="section">
    <div class="row"><span class="k">Subtotal</span><span class="v">PHP ${subtotal.toFixed(2)}</span></div>
    <div class="row"><span class="k">Platform Fee (10%)</span><span class="v">PHP ${fee.toFixed(2)}</span></div>
    <hr/>
    <div class="total-row"><span>TOTAL PAID</span><span class="v">PHP ${total.toFixed(2)}</span></div>
  </div>
  <div class="paid-stamp"><span>PAID</span></div>
  <div class="footer">
    <p>Thank you for choosing ServiceQ!</p>
    <p>Trusted Local Services &amp; Rentals in Cebu</p>
    <p style="margin-top:6px">support@serviceq.ph &nbsp;|&nbsp; serviceq.ph</p>
  </div>
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }<\/script>
</body>
</html>`)
    printWin.document.close()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Secure Checkout</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete your reservation securely via ServiceQ Escrow</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            method
              ? 'border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 shadow-xs'
              : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
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
                  method === pm.id ? 'border-brand-500 bg-brand-50/70 shadow-xs' : 'border-gray-200 hover:border-gray-300'
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
            disabled={loading || !method}
            className={`btn-primary btn-lg w-full font-bold shadow-sm mt-2 transition-all ${
              !method ? '!bg-gray-200 !text-gray-400 !border-gray-200 cursor-not-allowed shadow-none' : ''
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
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
      <Modal open={confirmed} onClose={() => navigate('/customer/bookings')} title="Booking Confirmed! 🎉" size="md">
        <div className="flex flex-col items-center text-center gap-4">
          <div id="printable-receipt" className="w-full flex flex-col items-center text-center gap-4">
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
              <div className="flex justify-between"><span className="text-gray-500">Payment Channel:</span><span className="capitalize font-medium">{method || 'GCash'}</span></div>
              <div className="border-t border-gray-200/70 pt-2 flex justify-between font-bold"><span className="text-gray-900">Total Paid:</span><span className="text-brand-600">{formatPHP(total)}</span></div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full pt-1 no-print">
            <button
              onClick={() => navigate('/customer/bookings')}
              className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              Go to My Bookings <ArrowRight size={16} />
            </button>

            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={handleDownloadReceipt}
                className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center justify-center gap-2 text-xs font-bold shadow-xs transition-all"
              >
                <Download size={14} className="text-emerald-600" /> Download PDF
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 px-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 flex items-center justify-center gap-2 text-xs font-bold shadow-xs transition-all"
              >
                <Printer size={14} className="text-blue-600" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

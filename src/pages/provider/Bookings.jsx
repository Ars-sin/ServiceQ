import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, CheckCircle, XCircle, CalendarCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { useAuth } from '@/contexts/AuthContext'

const TABS = [
  { id: 'all', label: 'All' },
  ...['pending', 'scheduled', 'active', 'completed', 'cancelled'].map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }))
]

export default function ProviderBookings() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [bookings, setBookings] = useState([])

  const loadBookings = () => {
    try {
      const seen = new Set()
      const combined = []

      const merge = (arr) => {
        if (!Array.isArray(arr)) return
        for (const b of arr) {
          if (b?.id && !seen.has(b.id)) {
            seen.add(b.id)
            combined.push(b)
          }
        }
      }

      // 1. Bookings saved directly to this provider by UUID
      if (user?.id) {
        merge(JSON.parse(localStorage.getItem(`serviceq_provider_bookings_${user.id}`)) || [])
      }

      // 2. All bookings from the global store
      const allBookings = JSON.parse(localStorage.getItem('serviceq_all_bookings')) || []
      merge(allBookings)

      // 3. Customer bookings store (catches anything not in all_bookings)
      merge(JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || [])

      // 4. Generic provider bookings store (demo fallback)
      merge(JSON.parse(localStorage.getItem('serviceq_provider_bookings')) || [])

      // 5. Scan all provider-name-keyed buckets
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('serviceq_provider_bookings_name_')) {
            merge(JSON.parse(localStorage.getItem(key)) || [])
          }
        }
      } catch {}

      // Sort newest first
      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setBookings(combined)
    } catch (e) {
      console.error('loadBookings error:', e)
    }
  }

  useEffect(() => {
    loadBookings()
    window.addEventListener('serviceq_bookings_updated', loadBookings)
    window.addEventListener('storage', loadBookings)
    return () => {
      window.removeEventListener('serviceq_bookings_updated', loadBookings)
      window.removeEventListener('storage', loadBookings)
    }
  }, [user?.id])




  const PAGE_SIZE = 4
  const isDefaultAll = tab === 'all'

  const visible = bookings.filter(b => tab === 'all' || b.status === tab)

  const displayed = isDefaultAll
    ? visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : visible

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setPage(1)
  }

  const updateStatus = (id, status) => {
    const bookingToUpdate = bookings.find(b => b.id === id)
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b)
    setBookings(updated)

    try {
      if (user?.id) {
        localStorage.setItem(`serviceq_provider_bookings_${user.id}`, JSON.stringify(updated))
      }
      localStorage.setItem('serviceq_provider_bookings', JSON.stringify(updated))

      // Update central all bookings
      const all = JSON.parse(localStorage.getItem('serviceq_all_bookings')) || []
      const updatedAll = all.map(b => b.id === id ? { ...b, status } : b)
      localStorage.setItem('serviceq_all_bookings', JSON.stringify(updatedAll))

      // Update customer bookings
      const cust = JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || []
      const updatedCust = cust.map(b => b.id === id ? { ...b, status } : b)
      localStorage.setItem('serviceq_customer_bookings', JSON.stringify(updatedCust))

      // If marked completed -> CREDIT PROVIDER BALANCE!
      if (status === 'completed' && bookingToUpdate) {
        const netAmt = Number(bookingToUpdate.net) || Math.round((Number(bookingToUpdate.amount) || 0) * 0.9)
        const currentAvail = Number(localStorage.getItem('serviceq_provider_avail_balance') || 0)
        const newAvail = currentAvail + netAmt
        localStorage.setItem('serviceq_provider_avail_balance', String(newAvail))

        // Also add transaction record
        const txns = JSON.parse(localStorage.getItem('serviceq_provider_transactions')) || []
        const newTxn = {
          id: 'TXN-' + Date.now().toString(36).toUpperCase().slice(-5),
          bookingId: id,
          customer: bookingToUpdate.customer || 'Customer',
          service: bookingToUpdate.service || 'Service',
          gross: Number(bookingToUpdate.amount) || 0,
          fee: Math.round((Number(bookingToUpdate.amount) || 0) * 0.1),
          net: netAmt,
          date: new Date().toISOString().split('T')[0],
          payout: 'released',
        }
        localStorage.setItem('serviceq_provider_transactions', JSON.stringify([newTxn, ...txns]))

        toast.success(`Booking completed! ${formatPHP(netAmt)} credited to your available balance.`)
        window.dispatchEvent(new Event('serviceq_withdrawals_updated'))
      } else {
        toast.success(`Booking status updated to ${status}`)
      }

      window.dispatchEvent(new Event('serviceq_bookings_updated'))
      window.dispatchEvent(new Event('storage'))
    } catch (e) {
      console.error(e)
    }

    setTab(status)
    setPage(1)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage incoming customer service requests and rentals</p>
        </div>
        {bookings.filter(b => b.status === 'pending').length > 0 && (
          <button
            onClick={() => handleTabChange('pending')}
            className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:bg-amber-100 transition-all animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            {bookings.filter(b => b.status === 'pending').length} New Booking{bookings.filter(b => b.status === 'pending').length > 1 ? 's' : ''} Pending
          </button>
        )}
      </div>
      <Tabs
        tabs={TABS.map(t => ({
          ...t,
          count: t.id === 'all' ? bookings.length : bookings.filter(b => b.status === t.id).length
        }))}
        active={tab}
        onChange={handleTabChange}
      />

      <div className="flex flex-col gap-4">
        {visible.length === 0 ? (
          <div className="card py-16 text-center text-gray-400 border border-gray-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CalendarCheck size={28} />
            </div>
            <p className="font-bold text-gray-800 text-base">No bookings found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              {tab === 'all'
                ? "You don't have any bookings yet. Incoming customer bookings will appear here."
                : `No ${tab} bookings found.`}
            </p>
          </div>
        ) : displayed.map(b => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card flex flex-col gap-4 border border-gray-100 shadow-xs">

            {/* ── Top row: customer identity + status ── */}
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                {(b.customer || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <Badge variant={statusVariant(b.status)} className="capitalize text-xs">{b.status}</Badge>
                  <span className="text-[11px] font-mono text-gray-400">{b.id}</span>
                  {b.createdAt && (
                    <span className="text-[11px] text-gray-400">
                      {new Date(b.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="font-bold text-gray-900 text-base">{b.customer || 'Customer'}</p>
                {b.customerEmail && (
                  <p className="text-xs text-gray-500">{b.customerEmail}</p>
                )}
              </div>
            </div>

            {/* ── Booking detail chips ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Service / Item</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{b.service || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Scheduled Date</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{b.date || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Sessions / Days</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{b.sessions || 1} session{(b.sessions || 1) > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
                <p className="text-[10px] text-emerald-700 font-medium uppercase tracking-wide">Total Paid</p>
                <p className="text-sm font-extrabold text-emerald-800 mt-0.5">{formatPHP(b.amount)}</p>
                {b.paymentMethod && (
                  <p className="text-[10px] text-emerald-600 font-medium uppercase mt-0.5">{b.paymentMethod}</p>
                )}
              </div>
            </div>

            {/* ── Net earnings info ── */}
            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-2">
              <span>Platform fee (10%): <strong className="text-red-500">−{formatPHP(b.fee || Math.round((b.amount || 0) * 0.1))}</strong></span>
              <span>Your earnings: <strong className="text-emerald-700">{formatPHP(b.net || Math.round((b.amount || 0) * 0.9))}</strong></span>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              {b.status === 'pending' && (
                <>
                  <button onClick={() => updateStatus(b.id, 'scheduled')} className="btn-primary btn-sm" style={{ background: '#059669' }}>
                    Accept Booking
                  </button>
                  <button onClick={() => updateStatus(b.id, 'cancelled')} className="btn-secondary btn-sm text-red-600 hover:bg-red-50">
                    Decline
                  </button>
                  <button onClick={() => toast(`Opening chat with ${b.customer}...`)} className="btn-secondary btn-sm gap-1">
                    <MessageCircle size={13} /> Contact
                  </button>
                </>
              )}
              {b.status === 'scheduled' && (
                <>
                  <button onClick={() => updateStatus(b.id, 'active')} className="btn-primary btn-sm bg-blue-600 hover:bg-blue-700 text-white">
                    Start Service / Item Handed Over
                  </button>
                  <button onClick={() => updateStatus(b.id, 'completed')} className="btn-primary btn-sm" style={{ background: '#059669' }}>
                    Mark Complete / Returned
                  </button>
                  <button onClick={() => toast(`Opening chat with ${b.customer}...`)} className="btn-secondary btn-sm gap-1">
                    <MessageCircle size={13} /> Contact
                  </button>
                </>
              )}
              {b.status === 'active' && (
                <>
                  <button onClick={() => updateStatus(b.id, 'completed')} className="btn-primary btn-sm" style={{ background: '#059669' }}>
                    Mark Complete / Returned
                  </button>
                  <button onClick={() => toast(`Opening chat with ${b.customer}...`)} className="btn-secondary btn-sm gap-1">
                    <MessageCircle size={13} /> Contact
                  </button>
                </>
              )}
              {b.status === 'completed' && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Payment Released
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {/* Conditional Pagination: only when tab === 'all' */}
        {isDefaultAll && visible.length > PAGE_SIZE && (
          <div className="card p-3">
            <Pagination
              currentPage={page}
              totalItems={visible.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

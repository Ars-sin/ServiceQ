import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, CalendarCheck, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { useAuth } from '@/contexts/AuthContext'
import { fetchProviderBookings, updateBookingStatusBackend, saveProviderBalancesBackend } from '@/lib/bookingsService'

const TABS = [
  { id: 'all', label: 'All' },
  ...['pending', 'scheduled', 'active', 'completed', 'cancelled'].map(id => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1)
  }))
]

// ── Read ALL bookings from every localStorage bucket ──────────────────────────
function readAllBookings(userId) {
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

  try {
    // 1. UUID-scoped bucket for this provider
    if (userId) {
      merge(JSON.parse(localStorage.getItem(`serviceq_provider_bookings_${userId}`)) || [])
    }

    // 2. Global all-bookings store
    merge(JSON.parse(localStorage.getItem('serviceq_all_bookings')) || [])

    // 3. Customer bookings store
    merge(JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || [])

    // 4. Generic provider bookings store
    merge(JSON.parse(localStorage.getItem('serviceq_provider_bookings')) || [])

    // 5. Every provider-name-keyed bucket
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('serviceq_provider_bookings_name_')) {
        merge(JSON.parse(localStorage.getItem(key)) || [])
      }
    }
  } catch (e) {
    console.error('readAllBookings error:', e)
  }

  // Newest first
  combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  return combined
}

export default function ProviderBookings() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [bookings, setBookings] = useState(() => readAllBookings(user?.id))
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const prevCountRef = useRef(0)

  // ── Core load function: instant local cache + live Supabase sync ───────────
  const loadBookings = useCallback(async (silent = true) => {
    // 1. Instant local read
    const localResult = readAllBookings(user?.id)
    if (localResult.length > 0) {
      setBookings(localResult)
    }
    setLastRefreshed(new Date())

    // 2. Live Supabase fetch (cross-browser / incognito truth)
    try {
      const liveResult = await fetchProviderBookings(user?.id, profile?.full_name)
      if (Array.isArray(liveResult)) {
        setBookings(liveResult)

        // Notify if new scheduled bookings arrived (no pending approval step anymore)
        const newScheduled = liveResult.filter(b => b.status === 'scheduled').length
        if (!silent && newScheduled > prevCountRef.current) {
          toast.success(`${newScheduled} new booking${newScheduled > 1 ? 's' : ''} received!`)
        }
        prevCountRef.current = newScheduled
        return liveResult
      }
    } catch (err) {
      console.warn('Backend bookings fetch error:', err)
    }

    return localResult
  }, [user?.id, profile?.full_name])

  // ── Manual refresh button ─────────────────────────────────────────────────
  const handleManualRefresh = async () => {
    setRefreshing(true)
    const result = await loadBookings(false)
    setRefreshing(false)
    if (!result || result.length === 0) {
      toast('No bookings found yet. Ensure customer completed payment.', { icon: 'ℹ️' })
    } else {
      toast.success(`Synced ${result.length} booking${result.length > 1 ? 's' : ''} from backend!`)
    }
  }

  // ── Auto-sync: events + polling + BroadcastChannel ────────────────────────
  useEffect(() => {
    // Initial load
    loadBookings(true)

    // A) Same-tab event listeners
    const handle = () => loadBookings(false)
    window.addEventListener('serviceq_bookings_updated', handle)
    window.addEventListener('storage', handle)

    // B) Cross-tab BroadcastChannel
    let bc = null
    try {
      bc = new BroadcastChannel('serviceq_bookings')
      bc.onmessage = () => loadBookings(false)
    } catch {}

    // C) Polling every 3.5 seconds — guarantees cross-browser / incognito sync
    const poll = setInterval(() => loadBookings(true), 3500)

    return () => {
      clearInterval(poll)
      window.removeEventListener('serviceq_bookings_updated', handle)
      window.removeEventListener('storage', handle)
      if (bc) bc.close()
    }
  }, [loadBookings])

  // ── Status actions ────────────────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    const bookingToUpdate = bookings.find(b => b.id === id)
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b)
    setBookings(updated)

    // Persist to local & backend
    await updateBookingStatusBackend(id, status, user?.id)

    try {
      // If completed → credit provider balance
      if (status === 'completed' && bookingToUpdate) {
        const netAmt = Number(bookingToUpdate.net) || Math.round((Number(bookingToUpdate.amount) || 0) * 0.9)
        const currentAvail = Number(localStorage.getItem('serviceq_provider_avail_balance') || 0)
        const newAvail = currentAvail + netAmt
        localStorage.setItem('serviceq_provider_avail_balance', String(newAvail))

        if (user?.id) {
          const currPend = Number(localStorage.getItem('serviceq_provider_pending_balance') || 0)
          saveProviderBalancesBackend(user.id, newAvail, currPend)
        }

        const txns = JSON.parse(localStorage.getItem('serviceq_provider_transactions')) || []
        localStorage.setItem('serviceq_provider_transactions', JSON.stringify([{
          id: 'TXN-' + Date.now().toString(36).toUpperCase().slice(-5),
          bookingId: id,
          customer: bookingToUpdate.customer || 'Customer',
          service: bookingToUpdate.service || 'Service',
          gross: Number(bookingToUpdate.amount) || 0,
          fee: Math.round((Number(bookingToUpdate.amount) || 0) * 0.1),
          net: netAmt,
          date: new Date().toISOString().split('T')[0],
          payout: 'released',
        }, ...txns]))

        toast.success(`✅ Booking completed! ${formatPHP(netAmt)} credited to your available balance.`)
        window.dispatchEvent(new Event('serviceq_withdrawals_updated'))
      } else {
        const labels = { scheduled: '✅ Booking accepted', cancelled: '❌ Booking declined', active: '🔵 Service started' }
        toast.success(labels[status] || `Status updated to ${status}`)
      }
    } catch (e) {
      console.error(e)
    }

    setTab(status)
    setPage(1)
  }

  const PAGE_SIZE = 4
  const isDefaultAll = tab === 'all'
  const visible = bookings.filter(b => tab === 'all' || b.status === tab)
  const displayed = isDefaultAll ? visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : visible

  const handleTabChange = (newTab) => { setTab(newTab); setPage(1) }

  const scheduledCount = bookings.filter(b => b.status === 'scheduled').length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Customer bookings auto-refresh every 5 seconds
            {lastRefreshed && (
              <span className="ml-1 text-gray-400">
                · Last checked {lastRefreshed.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {scheduledCount > 0 && (
            <button
              onClick={() => handleTabChange('scheduled')}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              {scheduledCount} Booking{scheduledCount > 1 ? 's' : ''} Scheduled
            </button>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
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
          <div className="card py-16 text-center border border-gray-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CalendarCheck size={28} />
            </div>
            <p className="font-bold text-gray-800 text-base">
              {tab === 'all' ? 'No bookings yet' : `No ${tab} bookings`}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              {tab === 'all'
                ? 'Once a customer completes checkout for your service or rental, it will appear here automatically.'
                : `No ${tab} bookings found.`}
            </p>
            <button
              onClick={handleManualRefresh}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              Check for new bookings
            </button>
          </div>
        ) : displayed.map(b => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card flex flex-col gap-4 border border-gray-100 shadow-xs">

            {/* ── Customer identity ── */}
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                {(b.customer || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <Badge variant={statusVariant(b.status)} className="capitalize text-xs">{b.status}</Badge>
                  <span className="text-[11px] font-mono text-gray-400">{b.id}</span>
                  {b.createdAt && (
                    <span className="text-[11px] text-gray-400">
                      Booked {new Date(b.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="font-bold text-gray-900 text-base">{b.customer || 'Customer'}</p>
                {b.customerEmail && <p className="text-xs text-gray-500">{b.customerEmail}</p>}
              </div>
            </div>

            {/* ── Detail chips ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Service / Item</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{b.service || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Date Requested</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{b.date || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Sessions</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{b.sessions || 1} session{(b.sessions || 1) > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
                <p className="text-[10px] text-emerald-700 font-medium uppercase tracking-wide">Total Paid</p>
                <p className="text-sm font-extrabold text-emerald-800 mt-0.5">{formatPHP(b.amount)}</p>
                {b.paymentMethod && <p className="text-[10px] text-emerald-600 font-medium uppercase mt-0.5">{b.paymentMethod}</p>}
              </div>
            </div>

            {/* ── Fee / earnings ── */}
            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
              <span>Platform fee (10%): <strong className="text-red-500">−{formatPHP(b.fee || Math.round((b.amount || 0) * 0.1))}</strong></span>
              <span>Your net earnings: <strong className="text-emerald-700 text-sm">{formatPHP(b.net || Math.round((b.amount || 0) * 0.9))}</strong></span>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex gap-2 flex-wrap items-center">
              {b.status === 'scheduled' && (
                <>
                  <button onClick={() => updateStatus(b.id, 'active')} className="btn-primary btn-sm bg-blue-600 hover:bg-blue-700 text-white">
                    🔵 Start Service / Handover Item
                  </button>
                  <button onClick={() => updateStatus(b.id, 'completed')} className="btn-primary btn-sm" style={{ background: '#059669' }}>
                    ✅ Mark Complete / Returned
                  </button>
                  <button onClick={() => toast(`Contact ${b.customer}`)} className="btn-secondary btn-sm gap-1">
                    <MessageCircle size={13} /> Contact
                  </button>
                </>
              )}
              {b.status === 'active' && (
                <>
                  <button onClick={() => updateStatus(b.id, 'completed')} className="btn-primary btn-sm" style={{ background: '#059669' }}>
                    ✅ Mark Complete / Item Returned
                  </button>
                  <button onClick={() => toast(`Contact ${b.customer}`)} className="btn-secondary btn-sm gap-1">
                    <MessageCircle size={13} /> Contact
                  </button>
                </>
              )}
              {b.status === 'completed' && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  💰 Payment Released to Earnings
                </span>
              )}
              {b.status === 'cancelled' && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                  Booking Declined
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {isDefaultAll && visible.length > PAGE_SIZE && (
          <div className="card p-3">
            <Pagination currentPage={page} totalItems={visible.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

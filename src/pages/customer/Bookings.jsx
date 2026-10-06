import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, statusVariant } from '@/lib/utils'
import { CANCELLATION_REASONS } from '@/lib/constants'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const TABS = [
  { id: 'all',       label: 'All' },
  { id: 'pending',   label: 'Pending' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'active',    label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function CustomerBookings() {
  const { user, profile } = useAuth()
  const [activeTab, setTab]           = useState('all')
  const [page, setPage]               = useState(1)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelNote, setCancelNote]  = useState('')
  const [reviewModal, setReviewModal] = useState(null)
  const [rating, setRating]          = useState(0)
  const [comment, setComment]        = useState('')

  // Load bookings scoped to the current authenticated customer (0 for newly registered customer)
  const [bookings, setBookings] = useState(() => {
    try {
      if (user?.id) {
        const stored = JSON.parse(localStorage.getItem(`serviceq_customer_bookings_${user.id}`))
        if (Array.isArray(stored)) return stored
      }
    } catch {}
    return []
  })

  // ── Sync with Supabase backend so provider accept / complete / new bookings reflect live ──
  useEffect(() => {
    let isMounted = true

    const syncCustomerBookings = async () => {
      const userId = user?.id ? String(user.id) : null
      const userEmail = (user?.email || profile?.email || '').trim().toLowerCase()
      const userName = (profile?.full_name || user?.user_metadata?.full_name || '').trim().toLowerCase()

      if (!userId && !userEmail && !userName) {
        setBookings([])
        return
      }

      const isBookingMine = (b) => {
        if (!b) return false
        if (userId && b.customerId && String(b.customerId) === userId) return true
        if (userEmail && b.customerEmail && b.customerEmail.toLowerCase().trim() === userEmail) return true
        if (userName && b.customer && b.customer.toLowerCase().trim() === userName) return true
        return false
      }

      try {
        const localMap = new Map()

        // 1. User-scoped localStorage cache
        if (userId) {
          try {
            const userStored = JSON.parse(localStorage.getItem(`serviceq_customer_bookings_${userId}`)) || []
            if (Array.isArray(userStored)) {
              userStored.forEach(b => { if (b?.id) localMap.set(b.id, b) })
            }
          } catch {}
        }

        // 2. Fallback general customer cache in localStorage
        try {
          const genStored = JSON.parse(localStorage.getItem('serviceq_customer_bookings')) || []
          if (Array.isArray(genStored)) {
            genStored.forEach(b => {
              if (b?.id && isBookingMine(b) && !localMap.has(b.id)) {
                localMap.set(b.id, b)
              }
            })
          }
        } catch {}

        // 3. Supabase platform_settings (Global synchronized bookings)
        const { data: gRow } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'serviceq_global_bookings')
          .maybeSingle()

        if (gRow?.value) {
          const cloudList = typeof gRow.value === 'string' ? JSON.parse(gRow.value) : gRow.value
          if (Array.isArray(cloudList)) {
            for (const cb of cloudList) {
              if (cb?.id && isBookingMine(cb)) {
                const existing = localMap.get(cb.id)
                localMap.set(cb.id, { ...existing, ...cb })
              }
            }
          }
        }

        // 4. Supabase `bookings` table (Direct database rows)
        try {
          if (userId || userEmail) {
            let query = supabase.from('bookings').select('*')
            if (userId && userEmail) {
              query = query.or(`customer_id.eq.${userId},customer_email.ilike.${userEmail}`)
            } else if (userId) {
              query = query.eq('customer_id', userId)
            } else {
              query = query.ilike('customer_email', userEmail)
            }
            const { data: dbRows } = await query
            if (Array.isArray(dbRows)) {
              for (const r of dbRows) {
                const norm = {
                  id: r.id,
                  bookingRef: r.booking_ref || r.id,
                  service: r.service_title || r.service || 'Service',
                  provider: r.provider_name || r.provider || 'Provider',
                  date: r.booking_date || r.date || new Date().toISOString().split('T')[0],
                  amount: Number(r.total_amount || r.amount || 0),
                  status: r.status || 'scheduled',
                  customerId: r.customer_id,
                  customerEmail: r.customer_email,
                  createdAt: r.created_at,
                }
                const existing = localMap.get(norm.id)
                localMap.set(norm.id, { ...existing, ...norm })
              }
            }
          }
        } catch {}

        // 5. Exclude any bookings from deleted users (SQI-29)
        let merged = Array.from(localMap.values())
        try {
          const deletedUsers = JSON.parse(localStorage.getItem('serviceq_deleted_users')) || []
          if (deletedUsers.length > 0) {
            const deletedIds = new Set(deletedUsers.map(u => u.id).filter(Boolean))
            merged = merged.filter(b => !(b.customerId && deletedIds.has(b.customerId)))
          }
        } catch {}

        merged.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))

        if (isMounted) {
          setBookings(merged)
          if (userId) {
            localStorage.setItem(`serviceq_customer_bookings_${userId}`, JSON.stringify(merged))
          }
          localStorage.setItem('serviceq_customer_bookings', JSON.stringify(merged))
        }
      } catch (err) {
        console.warn('Customer bookings sync warning:', err)
      }
    }

    syncCustomerBookings()

    window.addEventListener('serviceq_bookings_updated', syncCustomerBookings)
    window.addEventListener('storage', syncCustomerBookings)

    let bc = null
    try {
      bc = new BroadcastChannel('serviceq_bookings')
      bc.onmessage = syncCustomerBookings
    } catch {}

    const poll = setInterval(syncCustomerBookings, 2500)

    return () => {
      isMounted = false
      clearInterval(poll)
      window.removeEventListener('serviceq_bookings_updated', syncCustomerBookings)
      window.removeEventListener('storage', syncCustomerBookings)
      if (bc) bc.close()
    }
  }, [user?.id, user?.email, profile?.full_name])

  const PAGE_SIZE = 4
  const isDefaultAll = activeTab === 'all'

  const filtered = useMemo(() => {
    return bookings.filter(b => activeTab === 'all' || b.status === activeTab)
  }, [bookings, activeTab])

  const displayed = isDefaultAll
    ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filtered

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setPage(1)
  }

  // Real status update for cancellation
  const handleCancel = async () => {
    if (!cancelReason) return toast.error('Please select a reason for cancellation')
    if (cancelReason === 'OTHERS' && !cancelNote.trim()) return toast.error('Please describe your reason')

    const targetId = cancelModal.id
    const updated = bookings.map(b => b.id === targetId ? { ...b, status: 'cancelled', cancelReason: cancelReason } : b)
    setBookings(updated)

    try {
      if (user?.id) {
        localStorage.setItem(`serviceq_customer_bookings_${user.id}`, JSON.stringify(updated))
      }
      localStorage.setItem('serviceq_customer_bookings', JSON.stringify(updated))
      const allBk = JSON.parse(localStorage.getItem('serviceq_all_bookings')) || []
      localStorage.setItem('serviceq_all_bookings', JSON.stringify(allBk.map(b => b.id === targetId ? { ...b, status: 'cancelled' } : b)))

      // Update Supabase platform_settings
      const { data: gRow } = await supabase.from('platform_settings').select('value').eq('key', 'serviceq_global_bookings').maybeSingle()
      if (gRow?.value) {
        const cloudList = typeof gRow.value === 'string' ? JSON.parse(gRow.value) : gRow.value
        if (Array.isArray(cloudList)) {
          const updatedCloud = cloudList.map(b => b.id === targetId ? { ...b, status: 'cancelled' } : b)
          await supabase.from('platform_settings').upsert({
            key: 'serviceq_global_bookings',
            value: JSON.stringify(updatedCloud),
            updated_at: new Date().toISOString()
          })
        }
      }

      // Update Supabase bookings table if exists
      try {
        await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', targetId)
      } catch {}
    } catch {}

    window.dispatchEvent(new Event('serviceq_bookings_updated'))

    toast.success('Booking successfully cancelled.')
    setCancelModal(null)
    setCancelReason('')
    setCancelNote('')
  }

  const handleReview = async () => {
    if (!rating) return toast.error('Please select a rating')

    const targetId = reviewModal.id
    const updated = bookings.map(b => b.id === targetId ? { ...b, reviewed: true, userRating: rating, comment } : b)
    setBookings(updated)

    try {
      if (user?.id) {
        localStorage.setItem(`serviceq_customer_bookings_${user.id}`, JSON.stringify(updated))
      }
      localStorage.setItem('serviceq_customer_bookings', JSON.stringify(updated))
      const allBk = JSON.parse(localStorage.getItem('serviceq_all_bookings')) || []
      localStorage.setItem('serviceq_all_bookings', JSON.stringify(allBk.map(b => b.id === targetId ? { ...b, reviewed: true, userRating: rating } : b)))

      // Update Supabase platform_settings
      const { data: gRow } = await supabase.from('platform_settings').select('value').eq('key', 'serviceq_global_bookings').maybeSingle()
      if (gRow?.value) {
        const cloudList = typeof gRow.value === 'string' ? JSON.parse(gRow.value) : gRow.value
        if (Array.isArray(cloudList)) {
          const updatedCloud = cloudList.map(b => b.id === targetId ? { ...b, reviewed: true, userRating: rating } : b)
          await supabase.from('platform_settings').upsert({
            key: 'serviceq_global_bookings',
            value: JSON.stringify(updatedCloud),
            updated_at: new Date().toISOString()
          })
        }
      }
    } catch {}

    window.dispatchEvent(new Event('serviceq_bookings_updated'))

    toast.success('Review submitted! Thank you.')
    setReviewModal(null)
    setRating(0)
    setComment('')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track your upcoming reservations and past services</p>
        </div>
      </div>

      <Tabs
        tabs={TABS.map(t => ({
          ...t,
          count: t.id === 'all' ? bookings.length : bookings.filter(b => b.status === t.id).length
        }))}
        active={activeTab}
        onChange={handleTabChange}
      />

      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="card text-center py-16 text-gray-400 flex flex-col items-center justify-center gap-2">
            <p className="font-semibold text-gray-700 text-base">No {activeTab} bookings</p>
            <p className="text-xs text-gray-400">You do not have any bookings in this status right now.</p>
          </div>
        ) : (
          displayed.map(b => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-200/80 shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge>
                  <span className="text-xs text-gray-400 font-mono font-semibold">{b.id}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base">{b.service}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Provider: <span className="font-medium text-gray-700">{b.provider}</span> · Date: {b.date}
                </p>
              </div>

              <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2">
                <span className="font-extrabold text-brand-700 text-base">{formatPHP(b.amount)}</span>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {(b.status === 'pending' || b.status === 'scheduled' || b.status === 'active') && (
                    <button
                      onClick={() => toast.success(`Opening chat with ${b.provider}...`)}
                      className="btn-secondary btn-sm text-xs font-semibold text-brand-700 border-brand-200 hover:bg-brand-50"
                    >
                      Contact Provider
                    </button>
                  )}

                  {(b.status === 'pending' || b.status === 'scheduled') && (
                    <button
                      onClick={() => setCancelModal(b)}
                      className="btn-danger btn-sm text-xs font-medium"
                    >
                      Cancel Booking
                    </button>
                  )}

                  {b.status === 'completed' && !b.reviewed && (
                    <button
                      onClick={() => setReviewModal(b)}
                      className="btn-secondary btn-sm text-xs text-amber-700 border-amber-200 bg-amber-50/50 font-medium"
                    >
                      Review
                    </button>
                  )}

                  {b.reviewed && (
                    <span className="text-xs text-emerald-600 font-medium">
                      Reviewed ({b.userRating}/5)
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}

        {/* Conditional Pagination: only when activeTab === 'all' */}
        {isDefaultAll && filtered.length > PAGE_SIZE && (
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Booking">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel your booking for <strong className="text-gray-900">{cancelModal?.service}</strong> on {cancelModal?.date}?
          </p>

          <div className="form-group">
            <label className="label">Reason for cancellation</label>
            <select
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="input text-sm"
            >
              <option value="">Select a reason...</option>
              {CANCELLATION_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {cancelReason === 'OTHERS' && (
            <div className="form-group">
              <label className="label">Please specify</label>
              <textarea
                rows={2}
                value={cancelNote}
                onChange={e => setCancelNote(e.target.value)}
                className="input resize-none text-sm"
                placeholder="Details about cancellation..."
              />
            </div>
          )}

          <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 border border-amber-200">
            Any refund will be credited back to your original payment method in 1–3 business days according to the provider cancellation policy.
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setCancelModal(null)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-semibold text-xs transition-all shadow-xs"
            >
              Keep Booking
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all shadow-sm"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title="Rate & Review Service">
        <div className="flex flex-col gap-4">
          <div className="text-center py-2">
            <p className="text-xs text-gray-500 mb-2">Tap stars to rate your experience with {reviewModal?.provider}</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    size={28}
                    className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 fill-gray-100'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Your Comments (Optional)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="How was the service quality and punctuality?"
              className="input resize-none text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setReviewModal(null)} className="btn-ghost text-xs">
              Cancel
            </button>
            <button onClick={handleReview} className="btn-primary text-xs">
              Submit Review
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

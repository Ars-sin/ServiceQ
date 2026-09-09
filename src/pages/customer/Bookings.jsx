import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Star, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, statusVariant } from '@/lib/utils'
import { CANCELLATION_REASONS, BOOKING_STATUS } from '@/lib/constants'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

const MOCK_BOOKINGS = [
  { id: 'SQ-A1B2C', service: 'Professional Home Cleaning', provider: 'Maria Santos', date: '2026-09-10', amount: 1100, status: 'scheduled' },
  { id: 'SQ-D3E4F', service: 'Math & Science Tutoring',    provider: 'Engr. Cruz',   date: '2026-09-08', amount: 660,  status: 'active' },
  { id: 'SQ-G5H6I', service: 'DSLR Camera Rental',         provider: 'LensHub PH',   date: '2026-09-02', amount: 1320, status: 'completed' },
  { id: 'SQ-J7K8L', service: 'AC & Appliance Repair',      provider: 'Fix-It Crew',  date: '2026-08-29', amount: 385,  status: 'completed' },
  { id: 'SQ-M9N0O', service: 'Sound System Rental',        provider: 'Events Pro',   date: '2026-08-20', amount: 3850, status: 'cancelled' },
]

const TABS = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'active',    label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function CustomerBookings() {
  const [activeTab, setTab]         = useState('scheduled')
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelNote, setCancelNote]  = useState('')
  const [reviewModal, setReviewModal] = useState(null)
  const [rating, setRating]          = useState(0)
  const [comment, setComment]        = useState('')

  const bookings = MOCK_BOOKINGS.filter(b => b.status === activeTab)

  const handleCancel = () => {
    if (!cancelReason) return toast.error('Please select a reason')
    if (cancelReason === 'OTHERS' && !cancelNote.trim()) return toast.error('Please describe your reason')
    toast.success('Booking cancelled')
    setCancelModal(null); setCancelReason(''); setCancelNote('')
  }

  const handleReview = () => {
    if (!rating) return toast.error('Please select a rating')
    toast.success('Review submitted! Thank you.')
    setReviewModal(null); setRating(0); setComment('')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>

      <Tabs tabs={TABS.map(t => ({ ...t, count: MOCK_BOOKINGS.filter(b => b.status === t.id).length }))}
        active={activeTab} onChange={setTab} />

      <div className="flex flex-col gap-4">
        {bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-medium">No {activeTab} bookings</p>
          </div>
        ) : bookings.map(b => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge>
                <span className="text-xs text-gray-400 font-mono">{b.id}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{b.service}</h3>
              <p className="text-sm text-gray-500">{b.provider} · {b.date}</p>
              <p className="font-bold text-brand-600 mt-1">{formatPHP(b.amount)}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {b.status === 'scheduled' && <>
                <button onClick={() => toast('Redirecting to Messenger...')} className="btn-secondary btn-sm gap-1">
                  <MessageCircle size={13} /> Contact
                </button>
                <button onClick={() => setCancelModal(b)} className="btn-danger btn-sm">Cancel</button>
              </>}
              {b.status === 'active' && (
                <button onClick={() => toast('Redirecting to Messenger...')} className="btn-secondary btn-sm gap-1">
                  <MessageCircle size={13} /> Contact
                </button>
              )}
              {b.status === 'completed' && (
                <button onClick={() => setReviewModal(b)} className="btn-primary btn-sm gap-1">
                  <Star size={13} /> Leave Review
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cancel Modal */}
      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Booking">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Please tell us why you're cancelling <strong>{cancelModal?.service}</strong>.</p>
          <div className="form-group">
            <label className="label">Reason</label>
            <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="input">
              <option value="">Select reason...</option>
              {CANCELLATION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {cancelReason === 'OTHERS' && (
            <div className="form-group">
              <label className="label">Please describe</label>
              <textarea value={cancelNote} onChange={e => setCancelNote(e.target.value)} rows={3}
                placeholder="Tell us more..." className="input resize-none" />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setCancelModal(null)} className="btn-ghost flex-1">Keep Booking</button>
            <button onClick={handleCancel} className="btn-danger flex-1">Confirm Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title="Leave a Review">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">How was <strong>{reviewModal?.service}</strong>?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={32} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 fill-gray-200'} />
              </button>
            ))}
          </div>
          <div className="form-group">
            <label className="label">Comment (optional)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="Share your experience..." className="input resize-none" />
          </div>
          <button onClick={handleReview} className="btn-primary w-full">Submit Review</button>
        </div>
      </Modal>
    </motion.div>
  )
}

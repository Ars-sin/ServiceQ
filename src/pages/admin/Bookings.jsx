import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { formatPHP, statusVariant, relativeTime } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import toast from 'react-hot-toast'

const BOOKINGS = [
  { id: 'SQ-A1B2', customer: 'Ana Reyes',     provider: 'Maria Santos', service: 'Home Cleaning',     date: '2026-09-10', amount: 1100, status: 'scheduled', dispute: false },
  { id: 'SQ-C3D4', customer: 'Marco Lopez',   provider: 'Maria Santos', service: 'Deep Cleaning',     date: '2026-09-08', amount: 1320, status: 'active',    dispute: false },
  { id: 'SQ-E5F6', customer: 'Grace Tan',     provider: 'TechRent PH',  service: 'Laptop Rental',     date: '2026-09-05', amount: 880,  status: 'completed', dispute: false },
  { id: 'SQ-G7H8', customer: 'Rico Santos',   provider: 'Events Pro',   service: 'Sound System',      date: '2026-09-03', amount: 3850, status: 'cancelled',  dispute: true  },
  { id: 'SQ-I9J0', customer: 'Joy DC',        provider: 'LensHub PH',   service: 'Camera Rental',     date: '2026-09-01', amount: 660,  status: 'completed', dispute: false },
  { id: 'SQ-K1L2', customer: 'Carlo Mendoza', provider: 'MotoRent',     service: 'Motorcycle Rental', date: '2026-08-30', amount: 450,  status: 'scheduled', dispute: false },
  { id: 'SQ-M3N4', customer: 'Elena Gomez',   provider: 'CleanCare PH', service: 'Sofa Shampooing',   date: '2026-08-28', amount: 750,  status: 'active',    dispute: false },
  { id: 'SQ-O5P6', customer: 'David Lim',     provider: 'PowerPro Cebu',service: 'Generator Rental',  date: '2026-08-25', amount: 1200, status: 'completed', dispute: false },
  { id: 'SQ-Q7R8', customer: 'Sophia Sy',     provider: 'Fix-It Crew',  service: 'Aircon Cleaning',   date: '2026-08-22', amount: 500,  status: 'completed', dispute: false },
  { id: 'SQ-S9T0', customer: 'Mark Tan',      provider: 'SkyView PH',   service: 'Drone Kit Rental',  date: '2026-08-20', amount: 1100, status: 'cancelled',  dispute: false },
]

export default function AdminBookings() {
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [overrideModal, setOverride] = useState(null)
  const [refundModal, setRefund]    = useState(null)
  const [newStatus, setNewStatus]   = useState('')
  const [refundAmt, setRefundAmt]   = useState('')
  const [bookings, setBookings]     = useState(BOOKINGS)

  const PAGE_SIZE = 6
  const isDefaultAll = !search.trim()

  useEffect(() => { setPage(1) }, [search])

  const filtered = bookings.filter(b =>
    !search || b.id.includes(search.toUpperCase()) || b.customer.toLowerCase().includes(search.toLowerCase())
  )

  const displayed = isDefaultAll
    ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filtered

  const handleOverride = () => {
    if (!newStatus) return toast.error('Select a status')
    setBookings(prev => prev.map(b => b.id === overrideModal.id ? { ...b, status: newStatus } : b))
    toast.success(`Status overridden to: ${newStatus}`)
    setOverride(null); setNewStatus('')
  }

  const handleRefund = () => {
    if (!refundAmt) return toast.error('Enter refund amount')
    toast.success(`Refund of ${formatPHP(+refundAmt)} issued`)
    setRefund(null); setRefundAmt('')
  }

  const disputeCount = bookings.filter(b => b.dispute).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking &amp; Dispute Center</h1>
          <p className="text-xs text-gray-400 mt-0.5">{bookings.length} total bookings · {disputeCount} dispute{disputeCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by Booking ID or customer name..."
          className="input pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100 bg-gray-50">
              <th className="p-4 font-semibold">Booking ID</th>
              <th className="p-4 font-semibold">Customer</th>
              <th className="p-4 font-semibold">Provider</th>
              <th className="p-4 font-semibold">Service</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Amount</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-gray-400 text-sm">No bookings matching your search.</td>
              </tr>
            ) : (
              displayed.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-gray-700 font-semibold">{b.id}</span>
                      {b.dispute && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Dispute</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{b.customer}</td>
                  <td className="p-4 text-gray-500 text-sm">{b.provider}</td>
                  <td className="p-4 text-gray-500 text-sm">{b.service}</td>
                  <td className="p-4 text-gray-400 text-xs">{b.date}</td>
                  <td className="p-4 font-semibold text-gray-900">{formatPHP(b.amount)}</td>
                  <td className="p-4">
                    <Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => { setOverride(b); setNewStatus(b.status) }}
                        className="btn-ghost btn-sm text-xs px-2 py-1"
                      >
                        Override
                      </button>
                      {b.dispute && (
                        <button
                          onClick={() => toast('Dispute console opened')}
                          className="btn-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg px-2 py-1 text-xs font-medium"
                        >
                          Dispute
                        </button>
                      )}
                      <button
                        onClick={() => setRefund(b)}
                        className="btn-sm bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg px-2 py-1 text-xs font-medium"
                      >
                        Refund
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {isDefaultAll && filtered.length > PAGE_SIZE && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Override Status Modal */}
      <Modal open={!!overrideModal} onClose={() => setOverride(null)} title="Override Booking Status" size="sm">
        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
            Booking: <span className="font-bold font-mono">{overrideModal?.id}</span> · <span className="text-gray-500">{overrideModal?.customer}</span>
          </div>
          <div className="form-group">
            <label className="label">New Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input">
              {['pending', 'scheduled', 'active', 'completed', 'cancelled'].map(s => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setOverride(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleOverride} className="btn-primary flex-1">Apply Override</button>
          </div>
        </div>
      </Modal>

      {/* Refund Modal */}
      <Modal open={!!refundModal} onClose={() => setRefund(null)} title="Issue Refund" size="sm">
        <div className="flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            Booking <span className="font-bold font-mono">{refundModal?.id}</span> · Max refund: <span className="font-bold">{formatPHP(refundModal?.amount ?? 0)}</span>
          </div>
          <div className="form-group">
            <label className="label">Refund Amount (₱)</label>
            <input
              type="number"
              value={refundAmt}
              onChange={e => setRefundAmt(e.target.value)}
              placeholder="Enter amount..."
              className="input"
              max={refundModal?.amount}
            />
          </div>
          <div className="form-group">
            <label className="label">Reason</label>
            <textarea rows={2} className="input resize-none" placeholder="Reason for refund..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRefund(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleRefund} className="btn-primary flex-1">Issue Refund</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

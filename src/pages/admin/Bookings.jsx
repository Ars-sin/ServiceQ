import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { formatPHP, statusVariant, relativeTime } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import toast from 'react-hot-toast'

const BOOKINGS = [
  { id: 'SQ-A1B2', customer: 'Ana Reyes',     provider: 'Maria Santos', service: 'Home Cleaning',     date: '2026-09-10', amount: 1100, status: 'scheduled', dispute: false },
  { id: 'SQ-C3D4', customer: 'Marco Lopez',   provider: 'Maria Santos', service: 'Deep Cleaning',     date: '2026-09-08', amount: 1320, status: 'active',    dispute: false },
  { id: 'SQ-E5F6', customer: 'Grace Tan',     provider: 'TechRent PH',  service: 'Laptop Rental',     date: '2026-09-05', amount: 880,  status: 'completed', dispute: false },
  { id: 'SQ-G7H8', customer: 'Rico Santos',   provider: 'Events Pro',   service: 'Sound System',      date: '2026-09-03', amount: 3850, status: 'cancelled',  dispute: true },
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

  const PAGE_SIZE = 5
  const isDefaultAll = !search.trim()

  useEffect(() => {
    setPage(1)
  }, [search])

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Booking & Dispute Center</h1>

      <div className="relative">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by Booking ID or customer name..." className="input pl-4" />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="p-4 font-medium">Booking ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Provider</th>
              <th className="p-4 font-medium">Service</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-xs text-gray-500 flex items-center gap-1">
                  {b.id}
                  {b.dispute && <span className="text-red-500 text-xs">⚠️</span>}
                </td>
                <td className="p-4 font-medium text-gray-900">{b.customer}</td>
                <td className="p-4 text-gray-600">{b.provider}</td>
                <td className="p-4 text-gray-600">{b.service}</td>
                <td className="p-4 text-gray-400">{b.date}</td>
                <td className="p-4 font-semibold">{formatPHP(b.amount)}</td>
                <td className="p-4"><Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge></td>
                <td className="p-4">
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => { setOverride(b); setNewStatus(b.status) }} className="btn-ghost btn-sm text-xs">Override</button>
                    {b.dispute && <button onClick={() => toast('Dispute console opened')} className="btn-sm bg-red-100 text-red-700 rounded-lg px-2 py-1 text-xs">Dispute</button>}
                    <button onClick={() => setRefund(b)} className="btn-sm bg-amber-100 text-amber-700 rounded-lg px-2 py-1 text-xs">Refund</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Conditional Pagination: only when search is empty */}
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
      <Modal open={!!overrideModal} onClose={() => setOverride(null)} title="Override Booking Status">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Booking: <strong>{overrideModal?.id}</strong></p>
          <div className="form-group">
            <label className="label">New Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input">
              {['pending','scheduled','active','completed','cancelled'].map(s => (
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
      <Modal open={!!refundModal} onClose={() => setRefund(null)} title="Issue Refund">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Booking: <strong>{refundModal?.id}</strong> · Max: <strong>{formatPHP(refundModal?.amount ?? 0)}</strong></p>
          <div className="form-group">
            <label className="label">Refund Amount (₱)</label>
            <input type="number" value={refundAmt} onChange={e => setRefundAmt(e.target.value)}
              placeholder="Enter amount..." className="input" max={refundModal?.amount} />
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

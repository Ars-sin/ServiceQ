import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'

const MOCK = [
  { id: 'SQ-A1', customer: 'Ana Reyes',     service: 'Home Cleaning',     date: '2026-09-10', time: '9:00 AM', duration: '1 session', amount: 1100, status: 'pending',   payout: null },
  { id: 'SQ-B2', customer: 'Marco Lopez',   service: 'Home Cleaning',     date: '2026-09-08', time: '2:00 PM', duration: '1 session', amount: 550,  status: 'scheduled', payout: null },
  { id: 'SQ-C3', customer: 'Grace Tan',     service: 'Deep Cleaning',     date: '2026-09-07', time: '10:00 AM',duration: '1 session', amount: 1320, status: 'active',    payout: null },
  { id: 'SQ-D4', customer: 'Rico Santos',   service: 'Home Cleaning',     date: '2026-09-03', time: '8:00 AM', duration: '1 session', amount: 880,  status: 'completed', payout: 'released' },
  { id: 'SQ-E5', customer: 'Joy DC',        service: 'Office Cleaning',   date: '2026-08-28', time: '9:00 AM', duration: '1 session', amount: 880,  status: 'cancelled', payout: null },
  { id: 'SQ-F6', customer: 'Carlo Mendoza', service: 'Sofa Cleaning',     date: '2026-08-25', time: '1:00 PM', duration: '1 session', amount: 650,  status: 'completed', payout: 'released' },
  { id: 'SQ-G7', customer: 'Elena Gomez',   service: 'Move-in Deep Clean',date: '2026-08-22', time: '8:30 AM', duration: '1 session', amount: 1800, status: 'completed', payout: 'released' },
  { id: 'SQ-H8', customer: 'David Lim',     service: 'Window Cleaning',   date: '2026-08-20', time: '11:00 AM',duration: '1 session', amount: 400,  status: 'scheduled', payout: null },
]

const TABS = [
  { id: 'all', label: 'All' },
  ...['pending','scheduled','active','completed','cancelled'].map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }))
]

export default function ProviderBookings() {
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [bookings, setBookings] = useState(MOCK)

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
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    toast.success(`Booking ${status}`)
    setTab(status)
    setPage(1)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
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
          <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-2">📭</p><p>No {tab} bookings</p></div>
        ) : displayed.map(b => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
              {b.customer.split(' ').map(w => w[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge>
                <span className="text-xs font-mono text-gray-400">{b.id}</span>
              </div>
              <p className="font-semibold text-gray-900">{b.customer}</p>
              <p className="text-sm text-gray-500">{b.service} · {b.date} {b.time} · {b.duration}</p>
              <p className="font-bold text-brand-600 mt-1">{formatPHP(b.amount)}</p>
              {b.payout && <Badge variant="success" className="mt-1">Payout {b.payout}</Badge>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {b.status === 'pending' && <>
                <button onClick={() => updateStatus(b.id, 'scheduled')} className="btn-primary btn-sm gap-1" style={{ background: '#059669' }}>
                  <CheckCircle size={13} /> Accept
                </button>
                <button onClick={() => updateStatus(b.id, 'cancelled')} className="btn-danger btn-sm gap-1">
                  <XCircle size={13} /> Decline
                </button>
              </>}
              {b.status === 'scheduled' && <>
                <button onClick={() => updateStatus(b.id, 'active')} className="btn-primary btn-sm" style={{ background: '#059669' }}>Mark Active</button>
                <button onClick={() => toast('Messenger...')} className="btn-secondary btn-sm gap-1"><MessageCircle size={13} /> Contact</button>
              </>}
              {b.status === 'active' && <>
                <button onClick={() => updateStatus(b.id, 'completed')} className="btn-primary btn-sm" style={{ background: '#059669' }}>Mark Complete</button>
                <button onClick={() => toast('Messenger...')} className="btn-secondary btn-sm gap-1"><MessageCircle size={13} /> Contact</button>
              </>}
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

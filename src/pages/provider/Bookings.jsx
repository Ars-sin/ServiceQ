import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, CheckCircle, XCircle, CalendarCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP, statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'

const TABS = [
  { id: 'all', label: 'All' },
  ...['pending', 'scheduled', 'active', 'completed', 'cancelled'].map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }))
]

export default function ProviderBookings() {
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [bookings, setBookings] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('serviceq_provider_bookings'))
      if (Array.isArray(stored)) return stored
    } catch {}
    return []
  })

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
    setBookings(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, status } : b)
      try { localStorage.setItem('serviceq_provider_bookings', JSON.stringify(updated)) } catch {}
      return updated
    })
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
              {b.status === 'pending' && (
                <button onClick={() => toast(`Opening chat with ${b.customer}...`)} className="btn-secondary btn-sm gap-1">
                  <MessageCircle size={13} /> Contact
                </button>
              )}
              {b.status === 'scheduled' && (
                <button onClick={() => toast(`Opening chat with ${b.customer}...`)} className="btn-secondary btn-sm gap-1">
                  <MessageCircle size={13} /> Contact
                </button>
              )}
              {b.status === 'active' && <>
                <button onClick={() => updateStatus(b.id, 'completed')} className="btn-primary btn-sm" style={{ background: '#059669' }}>Mark Complete</button>
                <button onClick={() => toast(`Opening chat with ${b.customer}...`)} className="btn-secondary btn-sm gap-1"><MessageCircle size={13} /> Contact</button>
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

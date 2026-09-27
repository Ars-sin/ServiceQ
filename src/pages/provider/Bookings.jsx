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
      const userBookings = user?.id
        ? (JSON.parse(localStorage.getItem(`serviceq_provider_bookings_${user.id}`)) || [])
        : []

      // Also read from name-keyed bucket
      const providerNameKey = `serviceq_provider_bookings_name_${(profile?.full_name || profile?.business_name || '').trim().toLowerCase().replace(/\s+/g, '_')}`
      const nameKeyedBookings = providerNameKey.length > 40
        ? (JSON.parse(localStorage.getItem(providerNameKey)) || [])
        : []

      const allBookings = JSON.parse(localStorage.getItem('serviceq_all_bookings')) || []
      const genericBookings = JSON.parse(localStorage.getItem('serviceq_provider_bookings')) || []

      // Build a set of listing IDs that belong to this provider
      const myListingIds = new Set()
      try {
        if (user?.id) {
          const myListings = JSON.parse(localStorage.getItem(`serviceq_provider_listings_${user.id}`)) || []
          myListings.forEach(l => myListingIds.add(String(l.id)))
        }
      } catch {}

      // Match bookings by providerId, provider name, email, or listing ID
      const providerName = (profile?.full_name || profile?.business_name || '').toLowerCase()
      const providerEmail = (profile?.email || user?.email || '').toLowerCase()

      const relevantFromAll = allBookings.filter(b => {
        if (b.providerId && user?.id && String(b.providerId) === String(user.id)) return true
        if (providerName && b.provider && b.provider.toLowerCase() === providerName) return true
        if (providerEmail && b.customerEmail && b.customerEmail.toLowerCase() === providerEmail) return true
        if (b.listingId && myListingIds.has(String(b.listingId))) return true
        return false
      })

      const combined = [...userBookings]
      const ids = new Set(combined.map(b => b.id))

      // Merge name-keyed bookings
      for (const b of nameKeyedBookings) {
        if (!ids.has(b.id)) { combined.push(b); ids.add(b.id) }
      }

      for (const b of relevantFromAll) {
        if (!ids.has(b.id)) {
          combined.push(b)
          ids.add(b.id)
        }
      }

      // If still empty and generic demo bookings exist, display them
      if (combined.length === 0 && genericBookings.length > 0) {
        for (const b of genericBookings) {
          if (!ids.has(b.id)) {
            combined.push(b)
            ids.add(b.id)
          }
        }
      }

      // Sort newest first
      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setBookings(combined)
    } catch (e) {
      console.error(e)
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
  }, [user?.id, profile?.full_name, profile?.email])


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

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import { formatPHP, statusVariant } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Flag, Eye, Trash2 } from 'lucide-react'

const LISTINGS = [
  { id: '1',  title: 'Home Cleaning Service',   provider: 'Maria Santos', category: 'Cleaning',   price: 500,  status: 'active',   reports: 0 },
  { id: '2',  title: 'Laptop Rental (MacBook)', provider: 'TechRent PH',  category: 'Gadgets',    price: 800,  status: 'active',   reports: 0 },
  { id: '3',  title: 'Sound System Rental',     provider: 'Events Pro',   category: 'Events',     price: 3500, status: 'pending',  reports: 0 },
  { id: '4',  title: 'Motorcycle for Rent',     provider: 'MotoRent',     category: 'Vehicles',   price: 400,  status: 'active',   reports: 2 },
  { id: '5',  title: 'DSLR Camera Rental',      provider: 'LensHub PH',   category: 'Gadgets',    price: 600,  status: 'active',   reports: 1 },
  { id: '6',  title: 'Studio Unit for Rent',    provider: 'Urban Living', category: 'Properties', price: 7500, status: 'inactive', reports: 0 },
  { id: '7',  title: 'Catering Services',       provider: 'Lutong Pinoy', category: 'Services',   price: 250,  status: 'pending',  reports: 0 },
  { id: '8',  title: 'Suspicious Item Listing', provider: 'Unknown Shop', category: 'Rental',     price: 99,   status: 'active',   reports: 5 },
  { id: '9',  title: 'Aircon Cleaning & Repair',provider: 'CoolAir Cebu', category: 'Repairs',    price: 450,  status: 'active',   reports: 0 },
  { id: '10', title: 'Generator 3500W Rental',  provider: 'PowerPro Cebu',category: 'Equipment',  price: 1200, status: 'active',   reports: 0 },
  { id: '11', title: 'Deep Carpet Shampooing',  provider: 'CleanCare PH', category: 'Cleaning',   price: 700,  status: 'active',   reports: 0 },
  { id: '12', title: 'Drone 4K Video Kit',      provider: 'SkyView PH',   category: 'Gadgets',    price: 1100, status: 'pending',  reports: 0 },
]

const MOCK_REPORTS = [
  { id: 'r1', reporter: 'Ana Reyes', reason: 'Misleading description', date: '2026-09-05' },
  { id: 'r2', reporter: 'Marco L.',  reason: 'Item not as described',  date: '2026-09-04' },
]

const TABS = [
  { id: 'all',      label: 'All' },
  { id: 'pending',  label: 'Pending' },
  { id: 'active',   label: 'Active' },
  { id: 'reported', label: 'Reported' },
  { id: 'inactive', label: 'Inactive' },
]

// Category color dots
const CAT_COLOR = {
  Cleaning:   'bg-blue-400',
  Gadgets:    'bg-purple-400',
  Events:     'bg-pink-400',
  Vehicles:   'bg-orange-400',
  Properties: 'bg-teal-400',
  Services:   'bg-emerald-400',
  Rental:     'bg-red-400',
  Repairs:    'bg-yellow-400',
  Equipment:  'bg-indigo-400',
}

export default function AdminListings() {
  const [tab, setTab]         = useState('all')
  const [page, setPage]       = useState(1)
  const [listings, setListings] = useState(LISTINGS)
  const [reportsModal, setReportsModal] = useState(null)
  const [viewListing, setViewListing]   = useState(null)

  const PAGE_SIZE = 6
  const isDefaultAll = tab === 'all'

  const visible = listings.filter(l => {
    if (tab === 'all')      return true
    if (tab === 'reported') return l.reports > 0
    return l.status === tab
  })

  const displayed = isDefaultAll
    ? visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : visible

  const handleTabChange = newTab => { setTab(newTab); setPage(1) }

  const action = (id, newStatus) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
    toast.success(`Listing ${newStatus}`)
  }

  const remove = id => {
    const listing = listings.find(l => l.id === id)
    if (listing) {
      try {
        const existing = JSON.parse(localStorage.getItem('serviceq_audit_log')) || []
        const entry = {
          id: `a${Date.now()}`,
          staff: 'Admin', role: 'superadmin',
          action: 'Listing Deleted',
          target: listing.title,
          desc: `Deleted listing "${listing.title}" by ${listing.provider}.`,
          before: { status: listing.status },
          after: { status: 'deleted' },
          ip: '127.0.0.1',
          ts: new Date().toISOString(),
        }
        localStorage.setItem('serviceq_audit_log', JSON.stringify([entry, ...existing]))
      } catch {}
    }
    setListings(prev => prev.filter(l => l.id !== id))
    toast.success('Listing deleted and logged to Audit Log')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Listing Moderation</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {listings.length} total listings · {listings.filter(l => l.reports > 0).length} reported · {listings.filter(l => l.status === 'pending').length} pending review
        </p>
      </div>

      <Tabs
        tabs={TABS.map(t => ({
          ...t,
          count: t.id === 'all'
            ? listings.length
            : t.id === 'reported'
            ? listings.filter(l => l.reports > 0).length
            : listings.filter(l => l.status === t.id).length,
        }))}
        active={tab}
        onChange={handleTabChange}
      />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100 bg-gray-50">
              <th className="p-4 font-semibold">Listing</th>
              <th className="p-4 font-semibold">Provider</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Price</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Reports</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">No listings in this category</p>
                </td>
              </tr>
            ) : (
              displayed.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex-shrink-0 ${CAT_COLOR[l.category] ?? 'bg-gradient-to-br from-brand-400 to-accent-400'}`} />
                      <button
                        onClick={() => setViewListing(l)}
                        className="font-semibold text-gray-900 hover:text-brand-600 hover:underline text-left text-sm leading-tight"
                      >
                        {l.title}
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{l.provider}</td>
                  <td className="p-4">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{l.category}</span>
                  </td>
                  <td className="p-4 font-semibold text-brand-600">{formatPHP(l.price)}</td>
                  <td className="p-4">
                    <Badge variant={l.status === 'active' ? 'success' : l.status === 'pending' ? 'warning' : 'neutral'} className="capitalize">
                      {l.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {l.reports > 0 ? (
                      <button
                        onClick={() => setReportsModal(l)}
                        className="flex items-center gap-1 text-red-600 font-semibold text-xs hover:underline"
                      >
                        <Flag size={11} /> {l.reports} report{l.reports > 1 ? 's' : ''}
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5 flex-wrap items-center">
                      <button
                        onClick={() => setViewListing(l)}
                        className="btn-sm bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg px-2 py-1 text-xs flex items-center gap-1 font-medium"
                      >
                        <Eye size={11} /> View
                      </button>
                      {l.status === 'pending'  && <button onClick={() => action(l.id, 'active')}   className="btn-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg px-2 py-1 text-xs font-medium">Approve</button>}
                      {l.status === 'active'   && <button onClick={() => action(l.id, 'inactive')} className="btn-sm bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg px-2 py-1 text-xs font-medium">Disable</button>}
                      {l.status === 'inactive' && <button onClick={() => action(l.id, 'active')}   className="btn-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg px-2 py-1 text-xs font-medium">Enable</button>}
                      <button onClick={() => action(l.id, 'archived')} className="btn-sm bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-lg px-2 py-1 text-xs font-medium">Archive</button>
                      <button onClick={() => remove(l.id)} className="btn-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg px-2 py-1 text-xs font-medium flex items-center gap-1">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {isDefaultAll && visible.length > PAGE_SIZE && (
          <div className="p-4 border-t border-gray-100">
            <Pagination currentPage={page} totalItems={visible.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* View Listing Modal */}
      <Modal open={!!viewListing} onClose={() => setViewListing(null)} title="Listing Details" size="md">
        {viewListing && (
          <div className="flex flex-col gap-4">
            <div className={`w-full h-16 rounded-2xl flex items-center justify-center text-white font-bold text-sm px-4 text-center ${CAT_COLOR[viewListing.category] ?? 'bg-gradient-to-br from-brand-400 to-accent-400'}`}>
              {viewListing.title}
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-sm">
              {[
                ['Provider',   viewListing.provider],
                ['Category',   viewListing.category],
                ['Price',      formatPHP(viewListing.price)],
                ['Status',     viewListing.status],
                ['Reports',    viewListing.reports > 0 ? `${viewListing.reports} report(s)` : 'None'],
                ['Listing ID', `#${viewListing.id}`],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-gray-400 text-[11px] font-medium">{k}</p>
                  <p className="font-semibold text-gray-900 text-xs mt-0.5 capitalize">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {viewListing.status === 'pending'  && <button onClick={() => { action(viewListing.id, 'active');   setViewListing(null) }} className="btn-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl px-3 py-2 text-xs font-semibold flex-1">Approve</button>}
              {viewListing.status === 'active'   && <button onClick={() => { action(viewListing.id, 'inactive'); setViewListing(null) }} className="btn-sm bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl px-3 py-2 text-xs font-semibold flex-1">Disable</button>}
              {viewListing.status === 'inactive' && <button onClick={() => { action(viewListing.id, 'active');   setViewListing(null) }} className="btn-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl px-3 py-2 text-xs font-semibold flex-1">Enable</button>}
              <button onClick={() => setViewListing(null)} className="btn-ghost flex-1 text-xs">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reports Modal */}
      <Modal open={!!reportsModal} onClose={() => setReportsModal(null)} title={`Reports — ${reportsModal?.title}`} size="sm">
        <div className="flex flex-col gap-3">
          {reportsModal && MOCK_REPORTS.slice(0, reportsModal.reports).map(r => (
            <div key={r.id} className="flex items-start justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-900">{r.reporter}</p>
                <p className="text-sm text-gray-600">{r.reason}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.date}</p>
              </div>
              <button onClick={() => toast('Report dismissed')} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Dismiss</button>
            </div>
          ))}
          <button
            onClick={() => { action(reportsModal.id, 'inactive'); setReportsModal(null) }}
            className="btn-danger w-full mt-1"
          >
            Disable This Listing
          </button>
        </div>
      </Modal>
    </motion.div>
  )
}

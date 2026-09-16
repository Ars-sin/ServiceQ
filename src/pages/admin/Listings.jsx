import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import { formatPHP, statusVariant } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Flag } from 'lucide-react'

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
  { id: 'r1', reporter: 'Ana Reyes',  reason: 'Misleading description', date: '2026-09-05' },
  { id: 'r2', reporter: 'Marco L.',   reason: 'Item not as described',  date: '2026-09-04' },
]

const TABS = [
  { id: 'all',      label: 'All' },
  { id: 'pending',  label: 'Pending Review' },
  { id: 'active',   label: 'Active' },
  { id: 'reported', label: 'Reported' },
  { id: 'inactive', label: 'Inactive' },
]

export default function AdminListings() {
  const [tab, setTab]         = useState('all')
  const [page, setPage]       = useState(1)
  const [listings, setListings] = useState(LISTINGS)
  const [reportsModal, setReportsModal] = useState(null)

  const PAGE_SIZE = 5
  const isDefaultAll = tab === 'all'

  const visible = listings.filter(l => {
    if (tab === 'all')      return true
    if (tab === 'reported') return l.reports > 0
    return l.status === tab
  })

  // Paginate only when default 'all' is active
  const displayed = isDefaultAll
    ? visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : visible

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setPage(1)
  }

  const action = (id, newStatus) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
    toast.success(`Listing ${newStatus}`)
  }

  const remove = id => {
    setListings(prev => prev.filter(l => l.id !== id))
    toast.success('Listing deleted')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Listing Moderation</h1>

      <Tabs
        tabs={TABS.map(t => ({
          ...t,
          count: t.id === 'all' ? listings.length : t.id === 'reported' ? listings.filter(l => l.reports > 0).length : listings.filter(l => l.status === t.id).length,
        }))}
        active={tab} onChange={handleTabChange}
      />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="p-4 font-medium">Listing</th>
              <th className="p-4 font-medium">Provider</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Reports</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-accent-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900">{l.title}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-600">{l.provider}</td>
                <td className="p-4 text-gray-500">{l.category}</td>
                <td className="p-4 font-semibold text-brand-600">{formatPHP(l.price)}</td>
                <td className="p-4">
                  <Badge variant={l.status === 'active' ? 'success' : l.status === 'pending' ? 'warning' : 'neutral'} className="capitalize">
                    {l.status}
                  </Badge>
                </td>
                <td className="p-4">
                  {l.reports > 0 ? (
                    <button onClick={() => setReportsModal(l)}
                      className="flex items-center gap-1 text-red-600 font-semibold text-xs hover:underline">
                      <Flag size={12} /> {l.reports} report{l.reports > 1 ? 's' : ''}
                    </button>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="p-4">
                  <div className="flex gap-1.5 flex-wrap">
                    {l.status === 'pending'  && <button onClick={() => action(l.id, 'active')}   className="btn-sm bg-green-100 text-green-700 rounded-lg px-2 py-1 text-xs">Approve</button>}
                    {l.status === 'active'   && <button onClick={() => action(l.id, 'inactive')} className="btn-sm bg-amber-100 text-amber-700 rounded-lg px-2 py-1 text-xs">Disable</button>}
                    {l.status === 'inactive' && <button onClick={() => action(l.id, 'active')}   className="btn-sm bg-green-100 text-green-700 rounded-lg px-2 py-1 text-xs">Enable</button>}
                    <button onClick={() => action(l.id, 'archived')} className="btn-sm bg-gray-100 text-gray-600 rounded-lg px-2 py-1 text-xs">Archive</button>
                    <button onClick={() => remove(l.id)} className="btn-sm bg-red-100 text-red-700 rounded-lg px-2 py-1 text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <p className="text-3xl mb-2">📭</p><p>No listings in this category</p>
          </div>
        )}

        {/* Conditional Pagination: only when tab === 'all' */}
        {isDefaultAll && visible.length > PAGE_SIZE && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={page}
              totalItems={visible.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Reports Modal */}
      <Modal open={!!reportsModal} onClose={() => setReportsModal(null)} title={`Reports – ${reportsModal?.title}`}>
        <div className="flex flex-col gap-3">
          {MOCK_REPORTS.slice(0, reportsModal?.reports).map(r => (
            <div key={r.id} className="flex items-start justify-between p-3 bg-red-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">{r.reporter}</p>
                <p className="text-sm text-gray-600">{r.reason}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.date}</p>
              </div>
              <button onClick={() => toast('Report dismissed')} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
            </div>
          ))}
          <button onClick={() => { action(reportsModal.id, 'inactive'); setReportsModal(null) }}
            className="btn-danger w-full mt-2">Disable Listing</button>
        </div>
      </Modal>
    </motion.div>
  )
}

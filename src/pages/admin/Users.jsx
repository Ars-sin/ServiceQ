import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MoreVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { statusVariant, relativeTime } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

const USERS = [
  { id: '1', name: 'Ana Reyes',      email: 'ana@email.com',   phone: '09171111111', joined: '2026-01-15', bookings: 12, status: 'active' },
  { id: '2', name: 'Marco Lopez',    email: 'marco@email.com', phone: '09172222222', joined: '2026-02-20', bookings: 8,  status: 'active' },
  { id: '3', name: 'Grace Tan',      email: 'grace@email.com', phone: '09173333333', joined: '2026-03-10', bookings: 22, status: 'active' },
  { id: '4', name: 'Rico Santos',    email: 'rico@email.com',  phone: '09174444444', joined: '2026-04-05', bookings: 5,  status: 'suspended' },
  { id: '5', name: 'Joy Dela Cruz',  email: 'joy@email.com',   phone: '09175555555', joined: '2026-05-18', bookings: 1,  status: 'active' },
  { id: '6', name: 'Ben Cruz',       email: 'ben@email.com',   phone: '09176666666', joined: '2026-06-01', bookings: 0,  status: 'banned' },
  { id: '7', name: 'Lea Villanueva', email: 'lea@email.com',   phone: '09177777777', joined: '2026-06-20', bookings: 4,  status: 'active' },
  { id: '8', name: 'Carl Bautista',  email: 'carl@email.com',  phone: '09178888888', joined: '2026-07-12', bookings: 9,  status: 'active' },
]

export default function AdminUsers() {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [viewUser, setViewUser] = useState(null)
  const [users, setUsers]       = useState(USERS)

  const filtered = users
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search))
    .filter(u => filter === 'all' || u.status === filter)

  const action = (id, newStatus) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u))
    toast.success(`User ${newStatus}`)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="input pl-9" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-auto">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Phone</th>
              <th className="p-4 font-medium">Joined</th>
              <th className="p-4 font-medium">Bookings</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                      {u.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-500">{u.phone}</td>
                <td className="p-4 text-gray-500">{u.joined}</td>
                <td className="p-4 text-gray-700">{u.bookings}</td>
                <td className="p-4"><Badge variant={statusVariant(u.status)} className="capitalize">{u.status}</Badge></td>
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setViewUser(u)} className="btn-ghost btn-sm">View</button>
                    {u.status === 'active'    && <button onClick={() => action(u.id, 'suspended')} className="btn-sm bg-amber-100 text-amber-700 rounded-lg px-2 py-1 text-xs font-medium">Suspend</button>}
                    {u.status === 'suspended' && <button onClick={() => action(u.id, 'active')}    className="btn-sm bg-green-100 text-green-700 rounded-lg px-2 py-1 text-xs font-medium">Unsuspend</button>}
                    {u.status !== 'banned'    && <button onClick={() => action(u.id, 'banned')}    className="btn-sm bg-red-100 text-red-700 rounded-lg px-2 py-1 text-xs font-medium">Ban</button>}
                    {u.status === 'banned'    && <button onClick={() => action(u.id, 'active')}    className="btn-sm bg-blue-100 text-blue-700 rounded-lg px-2 py-1 text-xs font-medium">Reactivate</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View User Modal */}
      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="User Details" size="md">
        {viewUser && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-2xl">
                {viewUser.name.split(' ').map(w => w[0]).join('')}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{viewUser.name}</p>
                <Badge variant={statusVariant(viewUser.status)} className="capitalize mt-1">{viewUser.status}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Email', viewUser.email], ['Phone', viewUser.phone], ['Joined', viewUser.joined], ['Total Bookings', viewUser.bookings]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">{k}</p>
                  <p className="font-medium text-gray-900">{v}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { toast.success('Access reset email sent'); setViewUser(null) }} className="btn-secondary w-full">
              Reset Account Access
            </button>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

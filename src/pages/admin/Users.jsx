import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Loader, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { statusVariant } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import { supabase } from '@/lib/supabase'

export default function AdminUsers() {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [page, setPage]         = useState(1)
  const [viewUser, setViewUser] = useState(null)
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)

  const PAGE_SIZE = 6
  const isDefaultAll = filter === 'all' && !search.trim()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formatted = (data || []).map(u => ({
        id: u.id,
        name: u.full_name || 'Unnamed User',
        email: u.email,
        phone: u.phone || 'N/A',
        role: u.role || 'customer',
        joined: u.created_at ? u.created_at.slice(0, 10) : 'Recent',
        bookings: 0,
        status: u.is_active === false ? 'suspended' : 'active',
        address: [u.address, u.barangay, u.city, u.province].filter(Boolean).join(', ') || 'N/A',
      }))

      setUsers(formatted)
    } catch (err) {
      console.error('Error fetching users:', err)
      toast.error('Failed to load users from database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filtered = users
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    .filter(u => filter === 'all' || u.status === filter || u.role === filter)

  useEffect(() => {
    setPage(1)
  }, [filter, search])

  const displayed = isDefaultAll
    ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filtered

  const action = async (id, newStatus) => {
    const isActive = newStatus === 'active'
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error

      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u))
      toast.success(`User updated to ${newStatus}`)
    } catch (err) {
      toast.error('Failed to update user: ' + err.message)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-xs text-gray-500 mt-1">Live database users from Supabase</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-9"
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-auto">
          <option value="all">All Accounts</option>
          <option value="customer">Customers</option>
          <option value="provider">Providers</option>
          <option value="admin">Admins</option>
          <option value="active">Active Status</option>
          <option value="suspended">Suspended Status</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <Loader size={30} className="animate-spin text-brand-600" />
          <span className="text-sm font-medium">Loading users from database...</span>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                displayed.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                          {(u.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        u.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                        u.role === 'provider' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{u.phone}</td>
                    <td className="p-4 text-gray-500 text-xs">{u.joined}</td>
                    <td className="p-4">
                      <Badge variant={statusVariant(u.status)} className="capitalize">
                        {u.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setViewUser(u)} className="btn-ghost btn-sm text-xs">
                          View
                        </button>
                        {u.status === 'active' && u.role !== 'admin' && (
                          <button
                            onClick={() => action(u.id, 'suspended')}
                            className="btn-sm bg-amber-100 text-amber-700 rounded-lg px-2 py-1 text-xs font-medium"
                          >
                            Suspend
                          </button>
                        )}
                        {u.status === 'suspended' && (
                          <button
                            onClick={() => action(u.id, 'active')}
                            className="btn-sm bg-green-100 text-green-700 rounded-lg px-2 py-1 text-xs font-medium"
                          >
                            Unsuspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Conditional Pagination: only when filter is all and no search query */}
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
      )}

      {/* View User Modal */}
      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="User Account Details" size="md">
        {viewUser && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-2xl">
                {(viewUser.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{viewUser.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={statusVariant(viewUser.status)} className="capitalize">{viewUser.status}</Badge>
                  <span className="text-xs text-gray-400 capitalize">Role: {viewUser.role}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Email', viewUser.email],
                ['Phone', viewUser.phone],
                ['Joined Date', viewUser.joined],
                ['Address', viewUser.address],
                ['Account ID', viewUser.id],
                ['Role', viewUser.role],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">{k}</p>
                  <p className="font-medium text-gray-900 text-xs break-all">{v}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                toast.success('Account verified')
                setViewUser(null)
              }}
              className="btn-secondary w-full"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

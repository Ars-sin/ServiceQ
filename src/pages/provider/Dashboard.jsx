import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Package, CalendarCheck, Star, Users, Plus, DollarSign, TrendingUp, Clock, CheckCircle2, ShieldAlert } from 'lucide-react'
import { formatPHP, statusVariant } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [isVerified, setIsVerified] = useState(false)

  // Load listings from user-scoped key (mirrors Listings.jsx)
  const [listings, setListings] = useState([])

  useEffect(() => {
    if (!user?.id) return
    try {
      const stored = JSON.parse(localStorage.getItem(`serviceq_provider_listings_${user.id}`))
      if (Array.isArray(stored)) setListings(stored)
    } catch {}
  }, [user?.id])

  const [bookings, setBookings] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('serviceq_provider_bookings'))
      if (Array.isArray(stored)) return stored
    } catch {}
    return []
  })

  useEffect(() => {
    async function checkVerification() {
      if (!user?.id) return

      // 1. Check profile avatar_url metadata (persisted in profiles table)
      let meta = null
      try {
        if (profile?.avatar_url && profile.avatar_url.startsWith('{')) {
          meta = JSON.parse(profile.avatar_url)
        }
      } catch {}

      if (!meta) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('avatar_url, is_active')
          .eq('id', user.id)
          .maybeSingle()

        if (prof?.avatar_url && prof.avatar_url.startsWith('{')) {
          try { meta = JSON.parse(prof.avatar_url) } catch {}
        }
      }

      if (meta?.status === 'approved') {
        setIsVerified(true)
        return
      }
      if (meta?.status === 'rejected' || meta?.status === 'suspended') {
        setIsVerified(false)
        return
      }

      // 2. Check providers table if populated
      const { data: prov } = await supabase
        .from('providers')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (prov?.status === 'approved') {
        setIsVerified(true)
        return
      }
      if (prov?.status === 'rejected' || prov?.status === 'suspended') {
        setIsVerified(false)
        return
      }

      // 3. Local storage fallback
      const localApproved = localStorage.getItem(`provider_verified_${user.id}`) === 'true' ||
                            localStorage.getItem('serviceq_kyc_approved') === 'true'
      setIsVerified(localApproved)
    }
    checkVerification()
  }, [profile, user?.id])

  // Calculations for stats
  const totalListings = listings.length
  const totalBookings = bookings.length
  const uniqueCustomers = new Set(bookings.map(b => b.customer || b.customer_name)).size
  const avgRating = bookings.length > 0 ? '5.0★' : '—'

  const statusCounts = {
    pending: bookings.filter(b => b.status === 'pending').length,
    scheduled: bookings.filter(b => b.status === 'scheduled').length,
    active: bookings.filter(b => b.status === 'active').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  const completedBookings = bookings.filter(b => b.status === 'completed')
  const monthlyRevenue = completedBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  const todayRevenue = 0
  const netRevenue = monthlyRevenue * 0.9

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 size={12} /> Verified Provider
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Clock size={12} /> Verification Pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! Here's what's happening.</p>
        </div>
        <button
          onClick={() => navigate('/provider/listings?action=add')}
          className="btn-primary gap-2"
          style={{ background: '#059669' }}
        >
          <Plus size={16} /> Add Listing
        </button>
      </div>

      {/* Verification Status Banner (Option B) */}
      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-900 text-sm sm:text-base">Application Under Verification</h3>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">KYC REVIEW</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 mt-1 max-w-2xl leading-relaxed">
                Your provider application and government ID are currently being reviewed by our Admin team. You can set up your services and draft listings now, but they will be made live to customers once approved.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate('/provider/profile')}
              className="text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 px-3.5 py-2 rounded-xl transition flex-1 sm:flex-none text-center"
            >
              View KYC Status
            </button>
          </div>
        </div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Listings"   value={String(totalListings)}    icon={Package}       color="brand" />
        <StatCard label="Total Bookings"   value={String(totalBookings)}    icon={CalendarCheck} color="success" />
        <StatCard label="Average Rating"   value={avgRating}                icon={Star}          color="warning" />
        <StatCard label="Total Customers"  value={String(uniqueCustomers)}  icon={Users}         color="info" />
      </div>

      {/* Booking overview */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Booking Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl gap-1">
              <span className="text-2xl font-bold text-gray-900">{count}</span>
              <Badge variant={statusVariant(status)} className="capitalize text-xs">{status}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Today's Revenue"   value={formatPHP(todayRevenue)}   icon={DollarSign}  color="success" />
        <StatCard label="Monthly Revenue"   value={formatPHP(monthlyRevenue)} icon={TrendingUp}  color="brand" />
        <StatCard label="Net Revenue (90%)" value={formatPHP(netRevenue)}     icon={DollarSign}  color="info" />
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Bookings</h2>
          {bookings.length > 0 && (
            <button onClick={() => navigate('/provider/bookings')} className="text-sm text-emerald-600 hover:underline">View all</button>
          )}
        </div>
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-medium text-gray-600">No bookings yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Bookings from customers will appear here once your services receive requests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                  <th className="pb-3 font-medium">Booking ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.slice(0, 5).map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-mono text-xs text-gray-500">{b.id}</td>
                    <td className="py-3 font-medium text-gray-900">{b.customer || b.customer_name}</td>
                    <td className="py-3 text-gray-600">{b.service || b.listing_title}</td>
                    <td className="py-3 text-gray-500">{b.date}</td>
                    <td className="py-3 font-semibold">{formatPHP(b.amount)}</td>
                    <td className="py-3"><Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

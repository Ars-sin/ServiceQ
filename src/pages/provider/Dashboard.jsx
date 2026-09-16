import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Package, CalendarCheck, Star, Users, Plus, DollarSign, TrendingUp, Clock, CheckCircle2, ShieldAlert } from 'lucide-react'
import { formatPHP, statusVariant } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const BOOKINGS = [
  { id: 'SQ-A1B2', customer: 'Ana Reyes',    service: 'Home Cleaning',    date: '2026-09-10', amount: 1100, status: 'scheduled' },
  { id: 'SQ-C3D4', customer: 'Marco Lopez',  service: 'Home Cleaning',    date: '2026-09-08', amount: 550,  status: 'active' },
  { id: 'SQ-E5F6', customer: 'Grace Tan',    service: 'Home Cleaning',    date: '2026-09-05', amount: 1650, status: 'completed' },
  { id: 'SQ-G7H8', customer: 'Rico Santos',  service: 'Deep Cleaning',    date: '2026-09-03', amount: 880,  status: 'completed' },
  { id: 'SQ-I9J0', customer: 'Joy Dela Cruz','service': 'Home Cleaning',  date: '2026-08-28', amount: 550,  status: 'cancelled' },
]

const STATUS_COUNTS = { pending: 3, scheduled: 5, active: 2, completed: 28, cancelled: 4 }

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    async function checkVerification() {
      if (profile?.is_active) {
        setIsVerified(true)
        return
      }
      if (user?.id) {
        const { data } = await supabase.from('providers').select('status').eq('user_id', user.id).maybeSingle()
        if (data?.status === 'approved') {
          setIsVerified(true)
          return
        }
      }
      const approved = localStorage.getItem('serviceq_kyc_approved') === 'true'
      setIsVerified(approved)
    }
    checkVerification()
  }, [profile, user?.id])

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
        <button onClick={() => navigate('/provider/listings')} className="btn-primary gap-2" style={{ background: '#059669' }}>
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
        <StatCard label="Total Listings"   value="8"    icon={Package}      color="brand" />
        <StatCard label="Total Bookings"   value="42"   icon={CalendarCheck} color="success" trend={12} />
        <StatCard label="Average Rating"   value="4.8★" icon={Star}         color="warning" />
        <StatCard label="Total Customers"  value="31"   icon={Users}        color="info" />
      </div>

      {/* Booking overview */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Booking Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(STATUS_COUNTS).map(([status, count]) => (
            <div key={status} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl gap-1">
              <span className="text-2xl font-bold text-gray-900">{count}</span>
              <Badge variant={statusVariant(status)} className="capitalize text-xs">{status}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Today's Revenue"   value={formatPHP(1650)}   icon={DollarSign}  color="success" />
        <StatCard label="Monthly Revenue"   value={formatPHP(24800)}  icon={TrendingUp}  color="brand"   trend={8} />
        <StatCard label="Net Revenue (90%)" value={formatPHP(22320)}  icon={DollarSign}  color="info" />
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Bookings</h2>
          <button onClick={() => navigate('/provider/bookings')} className="text-sm text-emerald-600 hover:underline">View all</button>
        </div>
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
              {BOOKINGS.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-mono text-xs text-gray-500">{b.id}</td>
                  <td className="py-3 font-medium text-gray-900">{b.customer}</td>
                  <td className="py-3 text-gray-600">{b.service}</td>
                  <td className="py-3 text-gray-500">{b.date}</td>
                  <td className="py-3 font-semibold">{formatPHP(b.amount)}</td>
                  <td className="py-3"><Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '+ Add Listing',       action: '/provider/listings',      bg: 'bg-emerald-600 text-white' },
          { label: '📋 View Bookings',    action: '/provider/bookings',      bg: 'bg-white border border-gray-200 text-gray-700' },
          { label: '💰 View Earnings',    action: '/provider/earnings',      bg: 'bg-white border border-gray-200 text-gray-700' },
          { label: '⭐ My Subscription', action: '/provider/subscription',   bg: 'bg-white border border-gray-200 text-gray-700' },
        ].map(q => (
          <button key={q.label} onClick={() => navigate(q.action)}
            className={`${q.bg} rounded-xl p-4 text-sm font-semibold text-left hover:shadow-md transition-all active:scale-95`}>
            {q.label}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

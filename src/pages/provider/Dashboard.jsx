import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Package, CalendarCheck, Star, Users, Plus, DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, Ban, AlertTriangle } from 'lucide-react'

import { formatPHP, statusVariant } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { fetchProviderListings } from '@/lib/listingsService'
import { fetchProviderBookings } from '@/lib/bookingsService'
export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [kycStatus, setKycStatus] = useState('pending') // 'approved'|'rejected'|'suspended'|'pending'
  const [kycMeta, setKycMeta]     = useState(null)       // { rejection_reason, suspend_until, suspended_at, ... }
  const isVerified = kycStatus === 'approved'

  useEffect(() => {
    async function checkVerification() {
      const effectiveId = user?.id || profile?.id
      if (!effectiveId) return

      let meta = null
      // 1. Try profile context first
      try {
        if (profile?.avatar_url && profile.avatar_url.startsWith('{')) {
          meta = JSON.parse(profile.avatar_url)
        }
      } catch {}

      // 2. Fetch from Supabase profiles if not in context
      if (!meta) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('avatar_url, is_active')
          .eq('id', effectiveId)
          .maybeSingle()

        if (prof?.avatar_url && prof.avatar_url.startsWith('{')) {
          try { meta = JSON.parse(prof.avatar_url) } catch {}
        }
      }

      // 3. Fetch providers table for status and suspension info
      const { data: prov } = await supabase
        .from('providers')
        .select('status, rejection_reason, suspend_until, suspended_at')
        .eq('user_id', effectiveId)
        .maybeSingle()

      // Merge: providers table takes priority for status
      const resolvedStatus =
        prov?.status ||
        meta?.status ||
        (localStorage.getItem(`provider_verified_${effectiveId}`) === 'true' ? 'approved' : 'pending')

      setKycStatus(resolvedStatus)
      setKycMeta({
        rejection_reason: prov?.rejection_reason || meta?.rejection_reason || null,
        suspend_until:    prov?.suspend_until    || meta?.suspend_until    || null,
        suspended_at:     prov?.suspended_at     || meta?.suspended_at     || null,
        correction_message: meta?.correction_message || null,
      })
    }
    checkVerification()
  }, [profile, user?.id])


  const [listings, setListings] = useState([])

  useEffect(() => {
    if (!user?.id) return
    try {
      const stored = JSON.parse(localStorage.getItem(`serviceq_provider_listings_${user.id}`))
      if (Array.isArray(stored)) setListings(stored)
    } catch {}

    const effectiveId = user?.id || profile?.id
    if (!effectiveId) return

    fetchProviderListings(effectiveId).then(live => {
      if (Array.isArray(live) && live.length > 0) setListings(live)
    }).catch(() => {})
  }, [user?.id, profile?.id])

  const [bookings, setBookings] = useState([])

  useEffect(() => {
    const effectiveId = user?.id || profile?.id
    if (!effectiveId) return
    const provName = profile?.full_name || profile?.business_name
    try {
      const stored = JSON.parse(localStorage.getItem(`serviceq_provider_bookings_${effectiveId}`))
      if (Array.isArray(stored)) setBookings(stored)
    } catch {}

    fetchProviderBookings(effectiveId, provName).then(live => {
      if (Array.isArray(live)) setBookings(live)
    }).catch(() => {})
  }, [user?.id, profile?.id, profile?.full_name, profile?.business_name])


  // Calculations for stats

  const totalListings = listings.length
  const totalBookings = bookings.length
  const uniqueCustomers = new Set(bookings.map(b => b.customer || b.customer_name)).size
  const avgRating = (() => {
    try {
      const allRev = JSON.parse(localStorage.getItem('serviceq_reviews')) || []
      const myListingIds = new Set(listings.map(l => String(l.id)))
      const myListingTitles = new Set(listings.map(l => l.title?.trim().toLowerCase()))
      const matching = allRev.filter(r =>
        (r.listingId && myListingIds.has(String(r.listingId))) ||
        (r.service && myListingTitles.has(r.service.trim().toLowerCase()))
      )
      if (matching.length > 0) {
        return `${(matching.reduce((sum, r) => sum + Number(r.rating || 5), 0) / matching.length).toFixed(1)}★`
      }
      return '—'
    } catch {
      return '—'
    }
  })()

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
            {kycStatus === 'approved' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 size={12} /> Verified Provider
              </span>
            )}
            {kycStatus === 'suspended' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                <Ban size={12} /> Suspended
              </span>
            )}
            {kycStatus === 'rejected' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                <XCircle size={12} /> KYC Rejected
              </span>
            )}
            {(kycStatus === 'pending' || kycStatus === 'under_verification') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Clock size={12} /> Verification Pending
              </span>
            )}
            {kycStatus === 'correction_requested' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                <AlertTriangle size={12} /> Correction Required
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

      {/* ── KYC / Account Status Banners ─────────────────────────────── */}

      {/* SUSPENDED — full stop, show duration */}
      {kycStatus === 'suspended' && (() => {
        const until = kycMeta?.suspend_until ? new Date(kycMeta.suspend_until) : null
        const now   = new Date()
        const isIndefinite = !until
        const isExpired    = until && until <= now
        let durationText = 'indefinitely'
        if (until && !isExpired) {
          const diffMs   = until - now
          const diffDays = Math.ceil(diffMs / 86400000)
          if (diffDays < 31)       durationText = `for ${diffDays} more day${diffDays !== 1 ? 's' : ''}`
          else if (diffDays < 365) durationText = `for ~${Math.round(diffDays / 30)} more month${Math.round(diffDays / 30) !== 1 ? 's' : ''}`
          else                     durationText = `for ~${Math.round(diffDays / 365)} more year${Math.round(diffDays / 365) !== 1 ? 's' : ''}`
        }
        return (
          <div className="bg-red-50 border border-red-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700 flex-shrink-0 mt-0.5">
                <Ban size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-red-900 text-sm sm:text-base">Account Suspended</h3>
                  <span className="bg-red-200 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded-full">SUSPENDED</span>
                </div>
                <p className="text-xs sm:text-sm text-red-800 mt-1 leading-relaxed">
                  {isExpired
                    ? 'Your suspension period has ended. Please contact support to reactivate your account.'
                    : isIndefinite
                    ? 'Your account has been suspended indefinitely by the admin. Contact support for assistance.'
                    : <>Your account has been suspended <strong>{durationText}</strong> (until <strong>{until.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>). During this period you cannot accept bookings or publish listings.</>
                  }
                </p>
              </div>
            </div>
            <a
              href="mailto:support@serviceq.ph"
              className="text-xs font-semibold bg-white border border-red-300 text-red-900 hover:bg-red-100 px-3.5 py-2 rounded-xl transition flex-shrink-0 text-center"
            >
              Contact Support
            </a>
          </div>
        )
      })()}

      {/* REJECTED — show reason + resubmit button */}
      {kycStatus === 'rejected' && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0 mt-0.5">
              <XCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-rose-900 text-sm sm:text-base">KYC Application Rejected</h3>
                <span className="bg-rose-200 text-rose-900 text-[10px] font-bold px-2 py-0.5 rounded-full">REJECTED</span>
              </div>
              <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">
                Your KYC application was not approved. You can update your documents and resubmit.
              </p>
              {kycMeta?.rejection_reason && (
                <div className="mt-2 bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-900">
                  <span className="font-semibold text-rose-700">Reason: </span>
                  {kycMeta.rejection_reason}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/provider/onboarding')}
            className="text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 px-4 py-2 rounded-xl transition flex-shrink-0 text-center shadow-sm"
          >
            ✏ Edit &amp; Resubmit KYC
          </button>
        </div>
      )}

      {/* PENDING — under review */}
      {kycStatus === 'pending' && (
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
          <button
            onClick={() => navigate('/provider/profile')}
            className="text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 px-3.5 py-2 rounded-xl transition flex-1 sm:flex-none text-center"
          >
            View KYC Status
          </button>
        </div>
      )}

      {/* correction_requested — same as pending but highlight the note */}
      {kycStatus === 'correction_requested' && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm sm:text-base">Action Required: Correction Requested</h3>
              {kycMeta?.correction_message && (
                <div className="mt-1 bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-900">
                  <span className="font-semibold text-amber-700">Admin note: </span>
                  {kycMeta.correction_message}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/provider/onboarding')}
            className="text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 px-4 py-2 rounded-xl transition flex-shrink-0 shadow-sm"
          >
            ✏ Update &amp; Resubmit
          </button>
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

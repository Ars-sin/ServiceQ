import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Zap, Eye, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP } from '@/lib/utils'
import { SUBSCRIPTION_TIERS } from '@/lib/constants'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/contexts/AuthContext'
import { fetchProviderListings } from '@/lib/listingsService'

const FEATURES = [
  { label: 'Active Listings',      free: '3',   basic: '10',  premium: '50' },
  { label: 'Booking Management',   free: '✓',   basic: '✓',   premium: '✓' },
  { label: 'Analytics Dashboard',  free: 'Basic',basic: 'Full', premium: 'Advanced' },
  { label: 'Featured Listing',     free: '✗',   basic: '✗',   premium: '✓' },
  { label: 'Priority Support',     free: '✗',   basic: '✓',   premium: '✓' },
  { label: 'Custom Profile Badge', free: '✗',   basic: '✗',   premium: '✓' },
]

export default function ProviderSubscription() {
  const { user, profile } = useAuth()
  const [previewPlan, setPreviewPlan] = useState(null)
  const [currentTier, setCurrentTier] = useState('free')
  const [listingsCount, setListingsCount] = useState(0)

  useEffect(() => {
    // Dynamically calculate actual listing count for this provider
    let count = 0
    if (user?.id) {
      try {
        const stored = JSON.parse(localStorage.getItem(`serviceq_provider_listings_${user.id}`))
        if (Array.isArray(stored)) {
          count = stored.filter(l => l.status !== 'archived').length
        }
      } catch {}

      fetchProviderListings(user.id).then(live => {
        if (Array.isArray(live)) {
          const liveCount = live.filter(l => l.status !== 'archived').length
          if (liveCount > 0) setListingsCount(liveCount)
        }
      }).catch(() => {})
    }
    if (count === 0) {
      try {
        const custom = JSON.parse(localStorage.getItem('serviceq_custom_listings')) || []
        const mine = custom.filter(l => l.providerId === user?.id || (profile?.full_name && l.provider === profile.full_name))
        if (mine.length > 0) count = mine.length
      } catch {}
    }
    setListingsCount(count)

    // Load active subscription tier
    try {
      const savedTier = localStorage.getItem(`serviceq_provider_tier_${user?.id}`)
      if (savedTier && SUBSCRIPTION_TIERS[savedTier.toUpperCase()]) {
        setCurrentTier(savedTier)
      }
    } catch {}
  }, [user?.id, profile?.full_name])

  const current = SUBSCRIPTION_TIERS[currentTier.toUpperCase()] || SUBSCRIPTION_TIERS.FREE

  const handleUpgradeTier = (tier) => {
    setCurrentTier(tier.id)
    if (user?.id) {
      localStorage.setItem(`serviceq_provider_tier_${user.id}`, tier.id)
    }
    toast.success(`Subscribed to ${tier.label} Plan! 🎉`)
    setPreviewPlan(null)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 w-full">
      <h1 className="text-2xl font-bold text-gray-900">Subscription Plan</h1>

      {/* Current plan */}
      <div className="card bg-gradient-to-r from-brand-50 to-accent-50 border-brand-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">{current.label} Plan</p>
          </div>
          <div className="px-4 py-1.5 rounded-full font-bold text-sm bg-white border border-brand-200 text-gray-800 shadow-xs flex items-center">
            <span className="text-xs font-bold mr-0.5">₱</span>{current.price}<span className="text-xs font-normal text-gray-500 ml-1">/ month</span>
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-600">Listings used: {listingsCount} / {current.maxListings}</span>
          <span className="text-gray-500">{Math.round((listingsCount / current.maxListings) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
            style={{ width: `${Math.min(100, Math.round((listingsCount / current.maxListings) * 100))}%` }} />
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Object.values(SUBSCRIPTION_TIERS).map(tier => {
          const isActive = tier.id === currentTier
          return (
            <div
              key={tier.id}
              className={`card flex flex-col gap-5 relative transition-all ${
                isActive
                  ? 'border-2 border-brand-500 shadow-md ring-1 ring-brand-200'
                  : 'border border-gray-200 hover:border-gray-300'
              }`}
            >
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 bg-brand-600 text-white text-[11px] rounded-full font-bold shadow-sm">
                  Active
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {tier.id === 'free' ? 'Free' : tier.label}
                </span>
                <h3 className="text-xl font-extrabold text-gray-900">
                  {tier.id === 'free' ? 'Starter' : tier.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed min-h-[34px]">
                  {tier.id === 'free'
                    ? 'See how ServiceQ can help find clients, explore booking orders, and get things done in Cebu.'
                    : tier.id === 'basic'
                    ? 'Expand your reach with more listings, active notifications, and priority visibility.'
                    : 'Maximum power for established businesses, high-volume services, and busy rental fleets.'}
                </p>

                {/* Price Display with Pesos sign and zero */}
                <div className="mt-4 flex items-baseline">
                  <span className="text-base font-bold text-gray-800 self-start mt-1 mr-0.5">₱</span>
                  <span className="text-4xl font-black text-gray-900 tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-sm font-medium text-gray-500 ml-1.5">/ month</span>
                </div>
              </div>

              {/* Action Buttons: Preview + Upgrade */}
              <div className="flex flex-col gap-2">
                {isActive ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 rounded-full border border-gray-300 text-gray-700 bg-gray-50 font-semibold text-sm text-center shadow-xs cursor-default"
                  >
                    Your current plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpgradeTier(tier)}
                    className="w-full py-2.5 px-4 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm text-center shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap size={14} /> Upgrade to {tier.label}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewPlan(tier)}
                  className="w-full py-1.5 px-3 rounded-full text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye size={13} /> Preview Plan Details
                </button>
              </div>

              {/* Features list */}
              <div className="pt-2 border-t border-gray-100 flex-1 flex flex-col">
                <p className="text-xs font-bold text-gray-900 mb-2.5">
                  {tier.id === 'free' ? 'Start with the basics:' : 'Everything included:'}
                </p>
                <ul className="flex flex-col gap-2.5 flex-1">
                  <li className="text-xs text-gray-600 flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                    <span>Up to <strong>{tier.maxListings}</strong> active listings</span>
                  </li>
                  <li className="text-xs text-gray-600 flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                    <span>Automated booking scheduling</span>
                  </li>
                  {tier.id !== 'free' && (
                    <li className="text-xs text-gray-600 flex items-center gap-2">
                      <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                      <span>Priority customer search ranking</span>
                    </li>
                  )}
                  {tier.id === 'premium' && (
                    <li className="text-xs text-gray-600 flex items-center gap-2">
                      <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                      <span>Verified Featured Provider badge</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )
        })}
      </div>

      {/* Subscription Mode Preview Modal (O8) */}
      <Modal
        open={Boolean(previewPlan)}
        onClose={() => setPreviewPlan(null)}
        title={`${previewPlan?.label || 'Plan'} Mode Preview`}
        size="md"
      >
        {previewPlan && (
          <div className="flex flex-col gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-50 border border-brand-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Plan Overview</span>
                <h3 className="text-2xl font-black text-gray-900">{previewPlan.label}</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  {previewPlan.id === 'free' ? 'Ideal for exploring ServiceQ and starting out in Cebu' : previewPlan.id === 'basic' ? 'Best for growing full-time local service providers' : 'Designed for high-scale rental shops and professional crews'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-brand-700">₱{previewPlan.price}</span>
                <span className="text-xs text-gray-500 block">/ month</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Plan Inclusions & Limits</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block">Listing Capacity</span>
                  <span className="font-bold text-gray-900 text-sm">{previewPlan.maxListings} Listings</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block">Search Ranking</span>
                  <span className="font-bold text-gray-900 text-sm">{previewPlan.id === 'free' ? 'Standard' : previewPlan.id === 'basic' ? 'Priority Boost' : 'Top Tier VIP'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block">Support Tier</span>
                  <span className="font-bold text-gray-900 text-sm">{previewPlan.id === 'free' ? 'Community' : 'Priority 24/7'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block">Featured Provider Badge</span>
                  <span className="font-bold text-gray-900 text-sm">{previewPlan.id === 'premium' ? 'Included ✓' : 'Not Included'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPreviewPlan(null)}
                className="btn-ghost flex-1 text-xs"
              >
                Close Preview
              </button>
              {previewPlan.id !== currentTier && (
                <button
                  type="button"
                  onClick={() => handleUpgradeTier(previewPlan)}
                  className="btn-primary flex-1 text-xs font-bold"
                >
                  <Zap size={14} className="mr-1" /> Subscribe Now
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Feature comparison */}
      <div className="card overflow-x-auto p-0">
        <div className="p-4 border-b border-gray-100"><h2 className="font-bold text-gray-900">Plan Comparison</h2></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="p-4 font-medium">Feature</th>
              <th className="p-4 text-center font-medium">Free</th>
              <th className="p-4 text-center font-medium">Basic</th>
              <th className="p-4 text-center font-medium">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {FEATURES.map(f => (
              <tr key={f.label} className="hover:bg-gray-50">
                <td className="p-4 text-gray-700">{f.label}</td>
                {['free', 'basic', 'premium'].map(t => (
                  <td key={t} className={`p-4 text-center font-medium ${FEATURES[0][t] === '✗' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className={f[t] === '✓' ? 'text-green-500' : f[t] === '✗' ? 'text-gray-300' : ''}>{f[t]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

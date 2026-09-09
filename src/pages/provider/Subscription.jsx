import { motion } from 'framer-motion'
import { CheckCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPHP } from '@/lib/utils'
import { SUBSCRIPTION_TIERS } from '@/lib/constants'

const FEATURES = [
  { label: 'Active Listings',      free: '3',   basic: '10',  premium: '50' },
  { label: 'Booking Management',   free: '✓',   basic: '✓',   premium: '✓' },
  { label: 'Analytics Dashboard',  free: 'Basic',basic: 'Full', premium: 'Advanced' },
  { label: 'Featured Listing',     free: '✗',   basic: '✗',   premium: '✓' },
  { label: 'Priority Support',     free: '✗',   basic: '✓',   premium: '✓' },
  { label: 'Custom Profile Badge', free: '✗',   basic: '✗',   premium: '✓' },
]

const CURRENT_TIER = 'free'
const LISTINGS_USED = 2

export default function ProviderSubscription() {
  const current = SUBSCRIPTION_TIERS[CURRENT_TIER.toUpperCase()]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Subscription Plan</h1>

      {/* Current plan */}
      <div className="card bg-gradient-to-r from-brand-50 to-accent-50 border-brand-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">{current.label} Plan</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${CURRENT_TIER === 'free' ? 'bg-gray-200 text-gray-700' : 'gradient-brand text-white'}`}>
            {CURRENT_TIER === 'free' ? 'FREE' : formatPHP(current.price) + '/mo'}
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-600">Listings used: {LISTINGS_USED} / {current.maxListings}</span>
          <span className="text-gray-500">{Math.round((LISTINGS_USED / current.maxListings) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
            style={{ width: `${(LISTINGS_USED / current.maxListings) * 100}%` }} />
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(SUBSCRIPTION_TIERS).map(tier => {
          const isActive = tier.id === CURRENT_TIER
          return (
            <div key={tier.id} className={`card flex flex-col gap-4 relative ${isActive ? 'border-2 border-brand-400 shadow-brand-glow' : ''}`}>
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 text-white text-xs rounded-full font-bold">
                  Current Plan
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900 capitalize">{tier.label}</h3>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  {tier.price === 0 ? 'Free' : <><span className="text-base font-normal text-gray-500">₱</span>{tier.price}<span className="text-sm font-normal text-gray-500">/mo</span></>}
                </p>
              </div>
              <ul className="flex flex-col gap-2 flex-1">
                <li className="text-sm text-gray-600 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Up to <strong>{tier.maxListings}</strong> listings
                </li>
                {tier.id !== 'free' && (
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> Priority support
                  </li>
                )}
                {tier.id === 'premium' && (
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> Featured listing badge
                  </li>
                )}
              </ul>
              <button
                onClick={() => isActive ? null : toast.success(`Upgraded to ${tier.label}! 🎉`)}
                disabled={isActive}
                className={`btn w-full ${isActive ? 'btn-ghost opacity-50 cursor-default' : 'btn-primary gap-2'}`}>
                {isActive ? 'Active' : <><Zap size={14} /> Upgrade</>}
              </button>
            </div>
          )
        })}
      </div>

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

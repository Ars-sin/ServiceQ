import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wrench, RefreshCw, ArrowLeft, Mail, Phone, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

export default function MaintenancePage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [checking, setChecking] = useState(false)

  const handleCheckStatus = () => {
    setChecking(true)
    setTimeout(() => {
      const isMaintenance = localStorage.getItem('serviceq_maintenance_mode') === 'true'
      setChecking(false)
      if (!isMaintenance) {
        toast.success('Maintenance complete! Returning to ServiceQ...')
        if (role === 'admin') navigate('/admin/dashboard', { replace: true })
        else if (role === 'provider') navigate('/provider/dashboard', { replace: true })
        else if (role === 'customer') navigate('/customer/explore', { replace: true })
        else navigate('/', { replace: true })
      } else {
        toast('System maintenance is still underway. Please check back shortly.', { icon: '⏳' })
      }
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="ServiceQ" className="h-9 w-auto object-contain" />
          <span className="font-bold text-xl text-gray-900 tracking-tight">ServiceQ</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          Maintenance Active
        </span>
      </div>

      {/* Main Content Box */}
      <div className="max-w-lg w-full mx-auto my-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 text-center relative overflow-hidden"
        >
          {/* Top subtle decorative strip */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-brand-500 to-amber-500" />

          {/* Icon Badge */}
          <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Wrench size={38} className="animate-bounce" style={{ animationDuration: '2.5s' }} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Under Scheduled Maintenance
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
            We are performing necessary scheduled maintenance, system optimizations, and security updates. ServiceQ will be back online shortly!
          </p>

          {/* Status card */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Status</span>
              <span className="text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-full">In Progress</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Scope</span>
              <span className="text-gray-700 font-medium">Platform Upgrades & Performance</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Estimated Time</span>
              <span className="text-gray-700 font-medium">Under 1 hour</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="btn-primary gap-2 w-full sm:w-auto justify-center"
            >
              <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Checking Status...' : 'Check Again'}
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={16} /> Home
            </Link>
          </div>

          {/* Admin access note */}
          <div className="pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-2">Are you a platform administrator?</p>
            <Link
              to="/login?role=admin"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1"
            >
              <Lock size={12} /> Sign in to Admin Portal
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer Support Info */}
      <div className="max-w-4xl w-full mx-auto py-4 text-center">
        <p className="text-xs text-gray-400 mb-2">Need urgent assistance?</p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 font-medium">
          <span className="inline-flex items-center gap-1">
            <Mail size={13} className="text-gray-400" /> support@serviceq.ph
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone size={13} className="text-gray-400" /> +63 917 123 4567
          </span>
        </div>
      </div>
    </div>
  )
}

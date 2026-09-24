import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, Bell, Shield, Eye, EyeOff, Loader, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ProviderSettings() {
  const { user, profile, signOut } = useAuth()
  const [pwLoading, setPwLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirm: '' })

  const [notifications, setNotifications] = useState({
    bookingAlerts: true,
    payoutUpdates: true,
    marketing: false,
    systemAnnouncements: true,
  })

  const isPwLenValid = passwordForm.newPass.length >= 6
  const isPwMatch = passwordForm.newPass.length > 0 && passwordForm.newPass === passwordForm.confirm
  const isPasswordValid = isPwLenValid && isPwMatch

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!isPasswordValid) return
    setPwLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
      if (error) throw error
      toast.success('Password updated successfully!')
      setPasswordForm({ newPass: '', confirm: '' })
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your credentials, password security, and notification preferences</p>
      </div>

      {/* Account Credentials */}
      <div className="card border border-gray-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Mail size={18} className="text-emerald-600" />
          <h2 className="font-bold text-gray-900 text-base">Account Credentials</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Registered Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || profile?.email || ''}
              className="input bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">This email is used to log in and receive booking inquiries and updates.</p>
          </div>
          <div className="form-group">
            <label className="label">Account Role</label>
            <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-semibold text-emerald-800">
              <Shield size={16} className="text-emerald-600" /> Service Provider Partner
            </div>
            <p className="text-xs text-gray-400 mt-1">Verified partner status on ServiceQ Philippines.</p>
          </div>
        </div>
      </div>

      {/* Change Password (Slide 44) */}
      <div className="card border border-gray-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Lock size={18} className="text-emerald-600" />
          <h2 className="font-bold text-gray-900 text-base">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4 max-w-md">
          <div className="form-group">
            <label className="label">New Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password (min. 6 characters)"
                value={passwordForm.newPass}
                onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Confirm New Password *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-type new password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
              className="input"
            />
          </div>

          {/* Requirement indicators */}
          <div className="space-y-1.5 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className={`flex items-center gap-1.5 ${isPwLenValid ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
              <span>{isPwLenValid ? '✓' : '○'}</span> At least 6 characters
            </div>
            <div className={`flex items-center gap-1.5 ${isPwMatch ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
              <span>{isPwMatch ? '✓' : '○'}</span> Passwords match
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={pwLoading || !isPasswordValid}
              className="btn-primary text-xs px-6 py-2.5 font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#059669' }}
            >
              {pwLoading ? <><Loader size={14} className="animate-spin" /> Updating Password...</> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="card border border-gray-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Bell size={18} className="text-emerald-600" />
          <h2 className="font-bold text-gray-900 text-base">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'bookingAlerts', label: 'New Booking Inquiries', desc: 'Instant alerts when a customer books or inquires about your service' },
            { key: 'payoutUpdates', label: 'Payout & Earnings Releases', desc: 'Notifications when earnings become available or withdrawals complete' },
            { key: 'marketing', label: 'Promotions & Partner Tips', desc: 'Marketing suggestions to help grow your service bookings' },
            { key: 'systemAnnouncements', label: 'Platform Announcements', desc: 'Important service updates and policy changes from ServiceQ Admin' },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{n.label}</p>
                <p className="text-xs text-gray-400">{n.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications[n.key] ? 'bg-emerald-600' : 'bg-gray-200'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications[n.key] ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

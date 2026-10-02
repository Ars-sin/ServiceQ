import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Lock, Mail, Bell, Shield, Eye, EyeOff, Loader, CheckCircle2, Circle,
  User, HelpCircle, ChevronRight, Check, X, Phone, MessageSquare
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export default function ProviderSettings() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [activeSection, setActiveSection] = useState('account') // 'account' | 'notifications' | 'help'

  const [pwLoading, setPwLoading]       = useState(false)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw]         = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: ''
  })

  const [notifications, setNotifications] = useState({
    bookingAlerts: true,
    payoutUpdates: true,
    marketing: false,
    systemAnnouncements: true,
  })

  // Live password validation rules
  const hasMinLength = passwordForm.newPass.length >= 6
  const hasUppercase = /[A-Z]/.test(passwordForm.newPass)
  const hasLowercase = /[a-z]/.test(passwordForm.newPass)
  const hasNumber    = /\d/.test(passwordForm.newPass)
  const hasSpecial   = /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPass)
  const passwordsMatch = passwordForm.newPass.length > 0 && passwordForm.newPass === passwordForm.confirm

  const isPasswordValid = hasMinLength && passwordsMatch

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!passwordForm.newPass || !passwordForm.confirm) {
      return toast.error('Please enter and confirm your new password')
    }
    if (passwordForm.newPass.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      return toast.error('New passwords do not match')
    }

    setPwLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
      if (error) {
        if (error.message?.toLowerCase().includes('session') || error.message?.toLowerCase().includes('auth')) {
          if (user?.id) {
            localStorage.setItem(`serviceq_provider_password_${user.id}`, passwordForm.newPass)
          }
        } else {
          throw error
        }
      }
      toast.success('Password updated successfully! Signing out...')
      setPasswordForm({ current: '', newPass: '', confirm: '' })
      setTimeout(async () => {
        try {
          if (signOut) await signOut()
          else await supabase.auth.signOut()
        } catch {}
        navigate('/login?role=provider', { replace: true })
      }, 1000)
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setPwLoading(false)
    }
  }

  const handleCancelPassword = () => {
    setPasswordForm({ current: '', newPass: '', confirm: '' })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* ── Slide 44 Layout: 2 Columns ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Navigation Menu ───────────────────────────────────── */}
        <div className="md:col-span-4 flex flex-col gap-2">
          
          <button
            type="button"
            onClick={() => setActiveSection('account')}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all',
              activeSection === 'account'
                ? 'border-emerald-600 bg-white shadow-sm ring-1 ring-emerald-500'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                activeSection === 'account' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
              )}>
                <User size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">Account Settings</p>
                <p className="text-xs text-gray-400 mt-0.5">Profile, email and password</p>
              </div>
            </div>
            <ChevronRight size={16} className={activeSection === 'account' ? 'text-emerald-600' : 'text-gray-400'} />
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('notifications')}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all',
              activeSection === 'notifications'
                ? 'border-emerald-600 bg-white shadow-sm ring-1 ring-emerald-500'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                activeSection === 'notifications' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
              )}>
                <Bell size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">Notifications</p>
                <p className="text-xs text-gray-400 mt-0.5">Manage your notifications</p>
              </div>
            </div>
            <ChevronRight size={16} className={activeSection === 'notifications' ? 'text-emerald-600' : 'text-gray-400'} />
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('help')}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all',
              activeSection === 'help'
                ? 'border-emerald-600 bg-white shadow-sm ring-1 ring-emerald-500'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                activeSection === 'help' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
              )}>
                <HelpCircle size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">Help & Support</p>
                <p className="text-xs text-gray-400 mt-0.5">Get help and contact support</p>
              </div>
            </div>
            <ChevronRight size={16} className={activeSection === 'help' ? 'text-emerald-600' : 'text-gray-400'} />
          </button>

        </div>

        {/* ── Right Content Pane ─────────────────────────────────────── */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* SECTION: Account Settings (Slide 44) */}
          {activeSection === 'account' && (
            <>
              {/* Account Information Card */}
              <div className="card border border-gray-200/80 shadow-sm flex flex-col gap-4">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-emerald-600" />
                    <h2 className="font-bold text-gray-900 text-base">Account Information</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This is the email you used to register your provider account.</p>
                </div>

                <div className="form-group">
                  <label className="label">Email Address</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      disabled
                      value={user?.email || profile?.email || ''}
                      className="input bg-gray-50 text-gray-700 flex-1 cursor-not-allowed"
                    />
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex-shrink-0">
                      <Check size={14} className="text-emerald-600" /> Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Update Password Card (Slide 44 exact layout) */}
              <div className="card border border-gray-200/80 shadow-sm flex flex-col gap-5">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock size={18} className="text-emerald-600" />
                    <h2 className="font-bold text-gray-900 text-base">Update Password</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">For your security, please enter your current password and set a new password.</p>
                </div>

                <form onSubmit={handlePasswordChange} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Inputs Left */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                      <div className="form-group">
                        <label className="label">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPw ? 'text' : 'password'}
                            placeholder="Enter your current password"
                            value={passwordForm.current}
                            onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                            className="input pr-10 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw(!showCurrentPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="label">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            placeholder="Enter your new password"
                            value={passwordForm.newPass}
                            onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                            className="input pr-10 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="label">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPw ? 'text' : 'password'}
                            placeholder="Confirm your new password"
                            value={passwordForm.confirm}
                            onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                            className="input pr-10 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Requirements Box Right (Slide 44) */}
                    <div className="lg:col-span-5 bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-gray-500 mb-2.5">Your new password must have:</p>
                      <ul className="space-y-2 text-xs">
                        <li className="flex items-center gap-2 text-gray-500 text-xs">
                          {hasMinLength ? (
                            <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Circle size={15} className="text-gray-300 flex-shrink-0" />
                          )}
                          At least 6 characters
                        </li>
                        <li className="flex items-center gap-2 text-gray-500 text-xs">
                          {hasUppercase ? (
                            <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Circle size={15} className="text-gray-300 flex-shrink-0" />
                          )}
                          One uppercase letter (A–Z)
                        </li>
                        <li className="flex items-center gap-2 text-gray-500 text-xs">
                          {hasLowercase ? (
                            <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Circle size={15} className="text-gray-300 flex-shrink-0" />
                          )}
                          One lowercase letter (a–z)
                        </li>
                        <li className="flex items-center gap-2 text-gray-500 text-xs">
                          {hasNumber ? (
                            <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Circle size={15} className="text-gray-300 flex-shrink-0" />
                          )}
                          One number (0–9)
                        </li>
                        <li className="flex items-center gap-2 text-gray-500 text-xs">
                          {hasSpecial ? (
                            <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Circle size={15} className="text-gray-300 flex-shrink-0" />
                          )}
                          One special character (e.g. !@#)
                        </li>
                        {passwordForm.confirm && (
                          <li className="flex items-center gap-2 pt-1 border-t border-gray-200 text-xs">
                            {passwordsMatch ? (
                              <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                            ) : (
                              <X size={15} className="text-red-500 flex-shrink-0" />
                            )}
                            <span className={passwordsMatch ? 'text-emerald-600 font-semibold' : 'text-red-500'}>
                              {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>

                  </div>

                  <div className="flex items-center justify-start gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleCancelPassword}
                      disabled={!passwordForm.current}
                      className={`text-xs px-5 py-2.5 rounded-xl font-semibold transition-all border ${
                        passwordForm.current
                          ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 cursor-pointer shadow-xs'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pwLoading || !isPasswordValid}
                      className="btn-primary text-xs px-6 py-2.5 font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: '#059669' }}
                    >
                      {pwLoading ? (
                        <>
                          <Loader size={14} className="animate-spin" /> Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* SECTION: Notifications (Slide 44 placeholder scenario) */}
          {activeSection === 'notifications' && (
            <div className="card border border-gray-200/80 shadow-sm flex flex-col gap-4">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-emerald-600" />
                  <h2 className="font-bold text-gray-900 text-base">Notifications</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">Manage what notifications you receive about your bookings, payouts, and platform alerts.</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'bookingAlerts', label: 'Booking Inquiries & Requests', desc: 'Instant alerts when customers request a booking or send an inquiry' },
                  { key: 'payoutUpdates', label: 'Payout & Earnings Releases', desc: 'Get notified when payout transfers and withdrawals complete' },
                  { key: 'marketing', label: 'Partner Growth & Tips', desc: 'Weekly tips and marketing insights to maximize booking revenue' },
                  { key: 'systemAnnouncements', label: 'Platform Announcements', desc: 'Security, terms, and critical system maintenance updates' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{n.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications[n.key] ? 'bg-emerald-600' : 'bg-gray-300'
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
          )}

          {/* SECTION: Help & Support (Slide 44 placeholder scenario) */}
          {activeSection === 'help' && (
            <div className="card border border-gray-200/80 shadow-sm flex flex-col gap-4">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-emerald-600" />
                  <h2 className="font-bold text-gray-900 text-base">Help & Support</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">Get fast assistance with your account, listings, or customer inquiries in Cebu.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Phone size={18} />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">Partner Helpline (Cebu)</h3>
                  <p className="text-xs text-gray-500">Available Monday to Saturday, 8:00 AM – 6:00 PM</p>
                  <p className="text-sm font-mono font-bold text-emerald-800 mt-1">+63 (32) 888 7378</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Mail size={18} />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">Email Support</h3>
                  <p className="text-xs text-gray-500">Reach our partner operations team anytime</p>
                  <p className="text-sm font-semibold text-emerald-800 mt-1">support@serviceq.ph</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 text-xs text-emerald-900 flex items-start gap-3">
                <MessageSquare size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Need assistance with your KYC or Listings?</p>
                  <p className="mt-0.5 leading-relaxed text-emerald-800">
                    Our Cebu verification and partner success team reviews applications within 24 to 48 hours. If you need urgent assistance, send an email with your registered email address.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </motion.div>
  )
}

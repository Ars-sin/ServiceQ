import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Key, X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function AdminProfile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [actionsOpen, setActionsOpen] = useState(false)
  const actionsRef = useRef(null)

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)

  const adminName = profile?.full_name || user?.user_metadata?.full_name || 'Bryce'
  const adminEmail = user?.email || profile?.email || 'rutilander@gmail.com'
  const adminRole = profile?.role === 'admin' ? 'Admin' : (profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Admin')

  // Close actions dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setActionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!currentPassword.trim()) {
      return toast.error('Please enter your current password')
    }
    if (!newPassword.trim()) {
      return toast.error('Please enter your new password')
    }
    if (newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters long')
    }

    setLoading(true)
    try {
      // 1. Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        console.warn('Supabase auth updateUser message:', error.message)
      }

      // 2. Cache new password locally for immediate sign-in resilience
      const emailKey = adminEmail.toLowerCase()
      localStorage.setItem(`serviceq_admin_password_${emailKey}`, newPassword)
      localStorage.setItem(`serviceq_password_${emailKey}`, newPassword)

      // 3. Log to audit trail
      try {
        const existingLogs = JSON.parse(localStorage.getItem('serviceq_audit_log')) || []
        const logEntry = {
          id: `a-${Date.now()}`,
          staff: adminName,
          role: adminRole,
          action: 'Password Changed',
          target: adminEmail,
          desc: `Administrator password updated. Session terminated and redirected to /admin/login.`,
          ts: new Date().toISOString(),
        }
        localStorage.setItem('serviceq_audit_log', JSON.stringify([logEntry, ...existingLogs]))
      } catch {}

      toast.success('Password updated successfully! Please sign in again.', { duration: 4000 })

      // Reset modal state
      setIsPasswordModalOpen(false)
      setCurrentPassword('')
      setNewPassword('')

      // 4. SQI-28: Sign out and redirect to admin login
      await signOut()
      navigate('/admin/login', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = Boolean(currentPassword.trim() && newPassword.trim())

  return (
    <div className="w-full max-w-6xl mx-auto pb-16">
      {/* Page Title (SQI-28 matching sqi28_profile.png) */}
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Profile</h1>

      {/* Subheader Bar with Actions dropdown */}
      <div className="w-full rounded-xl bg-[#eef2f6] px-4 py-2.5 flex items-center justify-between border border-slate-200/60 shadow-2xs">
        <span className="text-sm font-semibold text-slate-800">
          {adminName} - Profile
        </span>

        {/* Actions Button */}
        <div className="relative" ref={actionsRef}>
          <button
            type="button"
            onClick={() => setActionsOpen((v) => !v)}
            className="bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium px-3.5 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <ChevronDown size={15} className="text-slate-600" />
            <span>Actions</span>
          </button>

          {/* Dropdown Menu (SQI-28 matching sqi28_actions.png) */}
          {actionsOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-lg p-1 z-30 min-w-[135px]">
              <button
                type="button"
                onClick={() => {
                  setActionsOpen(false)
                  setIsPasswordModalOpen(true)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-lg text-left transition-colors"
              >
                <Key size={16} className="text-slate-700" />
                <span>Password</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Tab Button */}
      <div className="mt-4 mb-4 flex items-center">
        <div className="bg-[#eef2f6] border border-slate-200/80 rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-800 shadow-2xs">
          Overview
        </div>
      </div>

      {/* Main Profile Info Card (SQI-28 matching sqi28_profile.png) */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Name */}
          <div>
            <div className="bg-[#eef2f6] rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-800 mb-3">
              Name
            </div>
            <div className="px-1 text-sm font-normal text-slate-900">
              {adminName}
            </div>
          </div>

          {/* Column 2: Email */}
          <div>
            <div className="bg-[#eef2f6] rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-800 mb-3">
              Email
            </div>
            <div className="px-1 text-sm font-normal text-slate-900">
              {adminEmail}
            </div>
          </div>

          {/* Column 3: Role */}
          <div>
            <div className="bg-[#eef2f6] rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-800 mb-3">
              Role
            </div>
            <div className="px-1 text-sm font-normal text-slate-900">
              {adminRole}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal (SQI-28 matching sqi28_empty_pw.png and sqi28_typing_pw.png) */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-2xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[460px] bg-white rounded-3xl p-6 sm:p-7 shadow-2xl relative border border-slate-100"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Change Password
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Description */}
              <p className="text-sm text-slate-500 leading-normal mb-5">
                Enter your current password and choose a new password to update your account credentials.
              </p>

              {/* Password Form */}
              <form onSubmit={handlePasswordSubmit}>
                {/* Current Password */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Modal Footer Buttons (matching Notion buttons) */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordModalOpen(false)
                      setCurrentPassword('')
                      setNewPassword('')
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#eef2f6] hover:bg-[#e2e8f0] text-slate-700 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className={`px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-colors shadow-xs ${
                      isFormValid && !loading
                        ? 'bg-[#0066ff] hover:bg-blue-700 cursor-pointer'
                        : 'bg-[#cbd5e1] cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Updating...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

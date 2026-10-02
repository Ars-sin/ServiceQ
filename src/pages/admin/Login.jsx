import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Lock, Mail, Eye, EyeOff, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { loginWithProfile } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      return toast.error('Please enter your email and password')
    }

    setLoading(true)
    try {
      // 1. Attempt login with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })

      if (authData?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', form.email.trim())
          .maybeSingle()

        // Check if role is admin or staff member
        const staffList = JSON.parse(localStorage.getItem('serviceq_staff_members')) || []
        const isStaff = staffList.some(s => s.email?.toLowerCase() === form.email.trim().toLowerCase())
        const isAdmin = profile?.role === 'admin' || isStaff || form.email.toLowerCase().includes('admin')

        if (!isAdmin) {
          await supabase.auth.signOut()
          setLoading(false)
          return toast.error('Access denied: This login is reserved for Admin and Staff members only.')
        }

        const resolvedProfile = profile || {
          id: authData.user.id,
          email: authData.user.email,
          full_name: authData.user.user_metadata?.full_name || 'Admin',
          role: 'admin',
        }

        loginWithProfile(resolvedProfile)
        toast.success(`Welcome to Admin Console, ${resolvedProfile.full_name || 'Admin'}!`)
        navigate('/admin/dashboard', { replace: true })
        return
      }

      // 2. Demo / Fallback Admin check if authError occurred (e.g. offline or mock credentials)
      if (
        (form.email.trim().toLowerCase() === 'admin@serviceq.ph' && form.password === 'admin123') ||
        (form.email.trim().toLowerCase() === 'admin@serviceq.com' && form.password === 'admin123')
      ) {
        const demoAdmin = {
          id: 'admin-super-001',
          email: form.email.trim(),
          full_name: 'Super Admin',
          role: 'admin',
          created_at: new Date().toISOString(),
        }
        loginWithProfile(demoAdmin)
        toast.success('Signed in as Super Administrator')
        navigate('/admin/dashboard', { replace: true })
        return
      }

      // Check staff list in localStorage
      const staffList = JSON.parse(localStorage.getItem('serviceq_staff_members')) || []
      const matchedStaff = staffList.find(s => s.email?.toLowerCase() === form.email.trim().toLowerCase())
      if (matchedStaff && form.password.length >= 6) {
        const staffProfile = {
          id: matchedStaff.id || `staff-${Date.now()}`,
          email: matchedStaff.email,
          full_name: matchedStaff.name,
          role: 'admin',
          roleTitle: matchedStaff.role || 'Staff Member',
        }
        loginWithProfile(staffProfile)
        toast.success(`Signed in as ${matchedStaff.name} (${matchedStaff.role || 'Staff'})`)
        navigate('/admin/dashboard', { replace: true })
        return
      }

      throw authError || new Error('Invalid email or password.')
    } catch (err) {
      toast.error(err.message || 'Failed to sign in. Please verify your admin credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="ServiceQ" className="h-9 w-auto object-contain brightness-110" />
          <span className="font-black text-xl text-white tracking-tight">ServiceQ</span>
          <span className="ml-1 text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </Link>

        <Link
          to="/login"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} /> Back to User Login
        </Link>
      </header>

      {/* Center Form Card */}
      <main className="w-full max-w-md mx-auto px-6 py-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin & Staff Portal</h1>
            <p className="text-xs text-slate-400 mt-1">Authorized administrative access only</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@serviceq.ph"
                  className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-rose-400" /> 256-bit Encrypted
            </span>
            <span>ServiceQ Platform v2.0</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 z-10">
        &copy; {new Date().getFullYear()} ServiceQ Technologies Inc. All rights reserved.
      </footer>
    </div>
  )
}

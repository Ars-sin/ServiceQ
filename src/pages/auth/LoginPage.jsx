import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Briefcase, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

const ROLE_REDIRECT = {
  customer: '/customer/explore',
  provider: '/provider/dashboard',
  admin:    '/admin/dashboard',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer'
  const [loginRole, setLoginRole] = useState(initialRole)

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw]           = useState(false)
  const [loading, setLoading]         = useState(false)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [resending, setResending]     = useState(false)

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (unconfirmed) setUnconfirmed(false)
  }

  const handleResendVerification = async () => {
    if (!form.email.trim()) return toast.error('Please enter your email')
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: form.email.trim(),
      })
      if (error) throw error
      toast.success(`Verification email sent to ${form.email.trim()}! Check your inbox.`)
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setUnconfirmed(false)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })
      if (error) throw error

      // Fetch role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const userRole = profile?.role || 'customer'
      const destination = ROLE_REDIRECT[userRole] ?? '/customer/explore'
      toast.success('Welcome back!')
      navigate(destination, { replace: true })
    } catch (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setUnconfirmed(true)
        toast.error('Your email is not verified yet. Please check your inbox.')
      } else {
        toast.error(err.message ?? 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative py-12">
      {/* ── Prominent Fixed/Floating Top Back Button ── */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-brand-600 hover:border-brand-300 font-semibold text-xs sm:text-sm shadow-sm transition-all hover:-translate-x-0.5 active:scale-95 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="ServiceQ" className="h-20 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-black text-brand-700">ServiceQ</h1>

          {/* Role Mode Badge */}
          {loginRole === 'provider' ? (
            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Briefcase size={13} /> Provider Portal Sign In
              </span>
              <p className="text-gray-500 text-xs mt-1">Manage your services, gear rentals, and bookings</p>
            </div>
          ) : (
            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                <UserCheck size={13} /> Customer Sign In
              </span>
              <p className="text-gray-500 text-xs mt-1">Book trusted local services and rentals in Cebu</p>
            </div>
          )}
        </div>

        <div className="card shadow-modal border border-gray-100">
          {/* Customer / Provider Login Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => setLoginRole('customer')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                loginRole === 'customer'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <UserCheck size={14} /> Customer
            </button>
            <button
              type="button"
              onClick={() => setLoginRole('provider')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                loginRole === 'provider'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Briefcase size={14} /> Provider
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="form-group">
              <label className="label">
                {loginRole === 'provider' ? 'Business or Registered Email' : 'Email address'}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="email" type="email" required
                  value={form.email} onChange={handleChange}
                  placeholder={loginRole === 'provider' ? 'provider@business.com' : 'you@email.com'}
                  className="input pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="password" type={showPw ? 'text' : 'password'} required
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  className="input pl-9 pr-10"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            {unconfirmed && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex flex-col gap-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span>⚠️</span> Email Not Verified
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Your email address has not been verified yet. Please check your inbox for the verification code or confirmation link.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="text-left font-bold text-brand-700 hover:text-brand-800 hover:underline pt-0.5"
                >
                  {resending ? 'Sending verification email...' : 'Resend Verification Email →'}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`btn-primary btn-lg w-full font-bold shadow-sm mt-1 ${
                loginRole === 'provider' ? '!bg-emerald-600 hover:!bg-emerald-700 text-white' : ''
              }`}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => toast('Google login coming soon!')} className="btn-secondary text-xs sm:text-sm py-2">
              <span>🇬</span> Google
            </button>
            <button onClick={() => toast('Facebook login coming soon!')} className="btn-secondary text-xs sm:text-sm py-2">
              <span>📘</span> Facebook
            </button>
          </div>

          {/* Role-Specific Sign Up Links */}
          {loginRole === 'provider' ? (
            <p className="text-center text-xs sm:text-sm text-gray-500 mt-5">
              Want to offer services or rent equipment?{' '}
              <Link to="/register?role=provider" className="text-emerald-700 font-bold hover:underline">
                Register as a Provider
              </Link>
            </p>
          ) : (
            <p className="text-center text-xs sm:text-sm text-gray-500 mt-5">
              Don't have an account?{' '}
              <Link to="/register?role=customer" className="text-brand-600 font-bold hover:underline">
                Sign up
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

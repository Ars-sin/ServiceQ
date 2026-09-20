import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

const ROLE_REDIRECT = {
  customer: '/customer/explore',
  provider: '/provider/dashboard',
  admin:    '/admin/dashboard',
}

export default function LoginPage() {
  const navigate = useNavigate()
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

      const destination = ROLE_REDIRECT[profile?.role] ?? '/customer/explore'
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 transition-colors mb-4 px-3 py-1.5 rounded-xl hover:bg-white/80 border border-transparent hover:border-gray-200 group w-fit"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Home
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="ServiceQ" className="h-20 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-bold text-brand-700">ServiceQ</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card shadow-modal">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="form-group">
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="email" type="email" required
                  value={form.email} onChange={handleChange}
                  placeholder="you@email.com"
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
              <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
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

            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
              {loading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Sign In'}
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
            <button onClick={() => toast('Google login coming soon!')} className="btn-secondary text-sm">
              <span>🇬</span> Google
            </button>
            <button onClick={() => toast('Facebook login coming soon!')} className="btn-secondary text-sm">
              <span>📘</span> Facebook
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

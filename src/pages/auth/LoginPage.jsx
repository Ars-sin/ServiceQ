import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Briefcase, UserCheck, Home } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import GoogleSignInModal from '@/components/auth/GoogleSignInModal'

const ROLE_REDIRECT = {
  customer: '/customer/explore',
  provider: '/provider/dashboard',
  admin:    '/admin/dashboard',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { loginWithProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer'
  const [loginRole, setLoginRole] = useState(initialRole)

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw]           = useState(false)
  const [loading, setLoading]         = useState(false)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [resending, setResending]     = useState(false)
  const [showGoogleModal, setShowGoogleModal] = useState(false)

  // Listen for active OAuth session (e.g. if redirected from Google OAuth)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        // Query profiles to see if this email exists in the system
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', session.user.email)
          .maybeSingle()

        if (profile?.role) {
          // Prevent cross-portal login
          if (loginRole === 'customer' && profile.role === 'provider') {
            await supabase.auth.signOut()
            toast.error('This account is registered as a Provider. You cannot log in through the Customer portal. Please switch to the Provider tab.')
            setLoginRole('provider')
            return
          }
          if (loginRole === 'provider' && profile.role === 'customer') {
            await supabase.auth.signOut()
            toast.error('This account is registered as a Customer. You cannot log in through the Provider portal. Please switch to the Customer tab.')
            setLoginRole('customer')
            return
          }

          loginWithProfile(profile)
          const destination = ROLE_REDIRECT[profile.role] || '/customer/explore'
          toast.success(`Welcome back, ${profile.full_name || profile.email}!`)
          navigate(destination, { replace: true })
        } else {
          toast('Google verified! Please choose your account type to complete registration.', { icon: '✨' })
          navigate(`/register?email=${encodeURIComponent(session.user.email)}&name=${encodeURIComponent(session.user.user_metadata?.full_name || '')}&from=google`, { replace: true })
        }
      }
    })
  }, [navigate, loginWithProfile, loginRole])

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

      // Enforce strict role boundary: Provider cannot log in via Customer, Customer cannot log in via Provider
      if (loginRole === 'customer' && userRole === 'provider') {
        await supabase.auth.signOut()
        toast.error('This account is registered as a Provider. You cannot log in through the Customer portal. Please switch to the Provider tab.')
        setLoginRole('provider')
        return
      }

      if (loginRole === 'provider' && userRole === 'customer') {
        await supabase.auth.signOut()
        toast.error('This account is registered as a Customer. You cannot log in through the Provider portal. Please switch to the Customer tab.')
        setLoginRole('customer')
        return
      }

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
      {/* ── Fixed/Floating Top Home Button ── */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          to="/"
          title="Back to Home"
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-brand-600 hover:border-brand-300 shadow-sm transition-all hover:scale-105 active:scale-95 group"
        >
          <Home size={18} className="text-gray-600 group-hover:text-brand-600 transition-colors" />
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
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="btn-secondary py-3 flex items-center justify-center hover:bg-gray-100 transition-colors"
              title="Sign in with Google"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => toast('Facebook login coming soon!')}
              className="btn-secondary py-3 flex items-center justify-center hover:bg-gray-100 transition-colors"
              title="Sign in with Facebook"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
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

      {/* Google Sign-In & Verification Modal */}
      <GoogleSignInModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        loginRole={loginRole}
        onSuccessLogin={(profile) => {
          loginWithProfile(profile)
          const destination = ROLE_REDIRECT[profile.role] || '/customer/explore'
          navigate(destination, { replace: true })
        }}
        onProceedRegister={({ email, role }) => {
          navigate(`/register?role=${role || loginRole || 'customer'}&email=${encodeURIComponent(email)}&from=google`, { replace: true })
        }}
      />
    </div>
  )
}

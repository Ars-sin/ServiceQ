import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Briefcase, UserCheck, Home } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { launchGoogleSignIn, parseGoogleOAuthReturn, handleGoogleAuthSuccess } from '@/lib/googleAuth'

const ROLE_REDIRECT = {
  customer: '/customer/explore',
  provider: '/provider/dashboard',
  admin:    '/admin/dashboard',
}

function isAdminAccount(email, role) {
  if (!email && !role) return false
  const cleanEmail = email ? email.trim().toLowerCase() : ''
  if (role === 'admin' || role === 'superadmin' || role === 'staff' || role === 'financial_staff' || role === 'support_moderator') return true
  if (cleanEmail === 'rutilander@gmail.com' || cleanEmail === 'admin@serviceq.ph') return true
  if (cleanEmail) {
    try {
      if (localStorage.getItem(`serviceq_admin_password_${cleanEmail}`)) return true
      const staffList = JSON.parse(localStorage.getItem('serviceq_admin_staff') || '[]')
      if (Array.isArray(staffList) && staffList.some(s => s.email?.toLowerCase() === cleanEmail)) return true
    } catch {}
  }
  return false
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

  // Listen for active OAuth session (e.g. redirected back from Google OAuth)
  useEffect(() => {
    let handled = false

    async function processOAuthUser(rawEmail, fullName) {
      if (!rawEmail || handled) return
      handled = true
      const cleanEmail = rawEmail.trim().toLowerCase()

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle()

      if (profile?.role) {
        // SQI-35: Admin credentials cannot log in on customer/provider portal
        if (isAdminAccount(cleanEmail, profile.role)) {
          await supabase.auth.signOut()
          toast.error('This login screen is for customers and providers only.')
          return
        }

        // Suspended account check
        if (profile.is_active === false) {
          await supabase.auth.signOut()
          toast.error('Your account has been suspended. Please contact support for assistance.')
          return
        }

        // Verified account -> update auth provider to google and proceed to login
        localStorage.setItem(`serviceq_auth_provider_${cleanEmail}`, 'google')
        if (profile.role) {
          setLoginRole(profile.role)
        }

        loginWithProfile(profile)
        const isMaintenance = localStorage.getItem('serviceq_maintenance_mode') === 'true'
        if (isMaintenance && profile.role !== 'admin') {
          navigate('/maintenance', { replace: true })
          return
        }
        const destination = ROLE_REDIRECT[profile.role] || (profile.role === 'provider' ? '/provider/dashboard' : '/customer/explore')
        toast.success(`Welcome back, ${profile.full_name || profile.email}! 👋`, { id: 'welcome-toast' })
        navigate(destination, { replace: true })
      } else {
        toast('Google verified! Please choose your account type to complete registration.', { icon: '✨', id: 'google-verified-toast' })
        navigate(
          `/register?email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(fullName || '')}&from=google&role=${loginRole || 'customer'}`,
          { replace: true }
        )
      }
    }

    // 1. Check if returning with access_token in URL hash from Google OAuth
    const googleUser = parseGoogleOAuthReturn()
    if (googleUser?.email) {
      if (window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
      processOAuthUser(googleUser.email, googleUser.name)
      return
    }

    // 2. Check standard Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        processOAuthUser(session.user.email, session.user.user_metadata?.full_name)
      }
    })

    // 3. Listen for async OAuth state changes (e.g. PKCE code exchange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        processOAuthUser(session.user.email, session.user.user_metadata?.full_name)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Listen for popup auth messages from GoogleAuthPopup
  useEffect(() => {
    const handleAuthMessage = (e) => {
      if (e.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { profile, email, isNewUser, role } = e.data
        if (isNewUser) {
          navigate(`/register?from=google&role=${role || loginRole || 'customer'}&email=${encodeURIComponent(email)}`)
        } else if (profile) {
          loginWithProfile(profile)
          const isMaintenance = localStorage.getItem('serviceq_maintenance_mode') === 'true'
          if (isMaintenance && profile.role !== 'admin') {
            navigate('/maintenance', { replace: true })
            return
          }
          const destination = ROLE_REDIRECT[profile.role] || '/customer/explore'
          navigate(destination, { replace: true })
        }
      }
    }
    window.addEventListener('message', handleAuthMessage)
    return () => window.removeEventListener('message', handleAuthMessage)
  }, [loginRole, navigate, loginWithProfile])

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setUnconfirmed(false)
    try {
      // ── Step 1: Pre-check role by email BEFORE signing in ──
      // This prevents the AuthContext race condition where onAuthStateChange
      // sets the user and redirects them before our role check can fire.
      const { data: preCheck } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', form.email.trim())
        .maybeSingle()

      if (preCheck) {
        // Suspended user — block before signing in
        if (preCheck.is_active === false) {
          toast.error('Your account has been suspended. Please contact support for assistance.')
          return
        }

        const preRole = preCheck.role || 'customer'

        // SQI-35: Admin credentials cannot log in on customer/provider login screen
        if (isAdminAccount(form.email, preRole)) {
          toast.error('This login screen is for customers and providers only.')
          return
        }

        // Wrong portal — show error, auto-switch tab, don't sign in at all
        if (loginRole === 'customer' && preRole === 'provider') {
          toast.error('This is a Provider account. Please use the Provider tab to sign in.')
          setLoginRole('provider')
          return
        }
        if (loginRole === 'provider' && preRole === 'customer') {
          toast.error('This is a Customer account. Please use the Customer tab to sign in.')
          setLoginRole('customer')
          return
        }
      } else {
        // Even if no preCheck profile row found yet, block if email belongs to admin/staff (SQI-35)
        if (isAdminAccount(form.email, null)) {
          toast.error('This login screen is for customers and providers only.')
          return
        }
      }

      // ── Step 2: Role matches (or no profile yet) — attempt sign-in ──
      const cleanEmail = form.email.trim().toLowerCase()
      const cachedPw =
        localStorage.getItem(`serviceq_password_${cleanEmail}`) ||
        localStorage.getItem(`serviceq_customer_password_${cleanEmail}`) ||
        localStorage.getItem(`serviceq_provider_password_${cleanEmail}`)

      // If a password was explicitly set or updated, strictly verify against it
      if (cachedPw) {
        if (form.password !== cachedPw) {
          throw new Error('Incorrect password. Please enter your valid updated password.')
        }

        // Attempt background Supabase sign-in to refresh tokens if available
        try {
          await supabase.auth.signInWithPassword({
            email: form.email.trim(),
            password: form.password,
          })
        } catch {}

        let resolvedProf = preCheck
        if (!resolvedProf || !resolvedProf.id) {
          try {
            const stored = JSON.parse(localStorage.getItem('serviceq_auth_profile'))
            if (stored?.email?.toLowerCase() === cleanEmail) {
              resolvedProf = stored
            }
          } catch {}
        }
        if (!resolvedProf || !resolvedProf.id) {
          try {
            const provStored = JSON.parse(localStorage.getItem(`serviceq_provider_profile_email_${cleanEmail}`))
            if (provStored) {
              resolvedProf = {
                id: `prov_${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
                email: cleanEmail,
                full_name: provStored.fullName || provStored.businessName || 'Service Provider',
                role: 'provider',
              }
            }
          } catch {}
        }
        if (!resolvedProf || !resolvedProf.id) {
          resolvedProf = {
            id: `user_${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
            email: cleanEmail,
            full_name: cleanEmail.split('@')[0],
            role: loginRole || 'customer',
          }
        }

        const effectiveRole = resolvedProf.role || loginRole || 'customer'

        // SQI-35 check
        if (isAdminAccount(cleanEmail, effectiveRole)) {
          toast.error('This login screen is for customers and providers only.')
          return
        }

        // Strict role boundary
        if (loginRole === 'customer' && effectiveRole === 'provider') {
          toast.error('This is a Provider account. Please use the Provider tab to sign in.')
          setLoginRole('provider')
          return
        }
        if (loginRole === 'provider' && effectiveRole === 'customer') {
          toast.error('This is a Customer account. Please use the Customer tab to sign in.')
          setLoginRole('customer')
          return
        }

        loginWithProfile(resolvedProf)
        localStorage.setItem(`serviceq_auth_provider_${cleanEmail}`, 'email')
        localStorage.setItem(`serviceq_password_${cleanEmail}`, form.password)

        const isMaintenance = localStorage.getItem('serviceq_maintenance_mode') === 'true'
        if (isMaintenance && effectiveRole !== 'admin') {
          navigate('/maintenance', { replace: true })
          return
        }
        const destination = ROLE_REDIRECT[effectiveRole] ?? (effectiveRole === 'provider' ? '/provider/dashboard' : '/customer/explore')
        toast.success(`Welcome back, ${resolvedProf.full_name || resolvedProf.email}! 👋`, { id: 'welcome-toast' })
        navigate(destination, { replace: true })
        return
      }

      // If no cached password exists, attempt direct Supabase auth sign-in
      let { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })

      if (error) {
        throw error
      }

      localStorage.setItem(`serviceq_password_${cleanEmail}`, form.password)
      if (loginRole === 'provider') {
        localStorage.setItem(`serviceq_provider_password_${cleanEmail}`, form.password)
      } else {
        localStorage.setItem(`serviceq_customer_password_${cleanEmail}`, form.password)
      }

      // ── Step 3: Fetch full profile post-login ──
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      // Deleted user (profile row removed by admin)
      if (!profile) {
        await supabase.auth.signOut()
        toast.error('This account no longer exists. Please contact support or create a new account.')
        return
      }

      const userRole = profile.role || 'customer'

      // SQI-35: Block admin credentials on customer/provider login screen
      if (isAdminAccount(profile.email, userRole)) {
        await supabase.auth.signOut()
        localStorage.removeItem('serviceq_auth_profile')
        toast.error('This login screen is for customers and providers only.')
        return
      }

      // Strict Role Boundary: Prevent provider from logging in under customer tab and vice versa
      if (loginRole === 'customer' && userRole === 'provider') {
        await supabase.auth.signOut()
        localStorage.removeItem('serviceq_auth_profile')
        toast.error('This account is registered as a Provider. Please use the Provider tab to sign in.')
        setLoginRole('provider')
        return
      }
      if (loginRole === 'provider' && userRole === 'customer') {
        await supabase.auth.signOut()
        localStorage.removeItem('serviceq_auth_profile')
        toast.error('This account is registered as a Customer. Please use the Customer tab to sign in.')
        setLoginRole('customer')
        return
      }

      localStorage.setItem(`serviceq_auth_provider_${form.email.trim().toLowerCase()}`, 'email')

      const isMaintenance = localStorage.getItem('serviceq_maintenance_mode') === 'true'
      if (isMaintenance && userRole !== 'admin') {
        navigate('/maintenance', { replace: true })
        return
      }
      const destination = ROLE_REDIRECT[userRole] ?? '/customer/explore'
      toast.success(`Welcome back, ${profile.full_name || profile.email}! 👋`, { id: 'welcome-toast' })
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
              <Link
                to={`/forgot-password?role=${loginRole}`}
                className={`text-xs hover:underline font-semibold transition-colors ${
                  loginRole === 'provider' ? 'text-emerald-700 hover:text-emerald-800' : 'text-brand-600 hover:text-brand-700'
                }`}
              >
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
              disabled={loading || !form.email.trim() || !form.password}
              className={`btn-primary btn-lg w-full font-bold shadow-sm mt-1 disabled:opacity-50 disabled:cursor-not-allowed ${
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

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

export default function GoogleSignInModal({
  isOpen,
  onClose,
  onSuccessLogin,
  onProceedRegister,
  loginRole = 'customer',
}) {
  const [view, setView] = useState('accounts') // 'accounts' | 'input'
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState([])

  useEffect(() => {
    if (!isOpen) return
    setEmail('')
    setChecking(false)

    async function loadAccounts() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, is_active, avatar_url')
          .ilike('email', '%@gmail.com')
          .limit(10)

        if (data && data.length > 0) {
          const filtered = data.filter(acc => {
            const r = acc.role?.toLowerCase()
            const em = acc.email?.toLowerCase()
            return r !== 'admin' && r !== 'superadmin' && r !== 'staff' &&
                   r !== 'financial_staff' && r !== 'support_moderator' &&
                   em !== 'rutilander@gmail.com' && em !== 'admin@serviceq.ph'
          }).slice(0, 3)

          if (filtered.length > 0) {
            setSavedAccounts(filtered)
            setView('accounts')
          } else {
            setView('input')
          }
        } else {
          setView('input')
        }
      } catch {
        setView('input')
      }
    }
    loadAccounts()
  }, [isOpen])

  if (!isOpen) return null

  const handleProcessAccount = async (targetEmail, accountProfile = null) => {
    const cleanEmail = (targetEmail || email).trim().toLowerCase()
    if (!cleanEmail) return toast.error('Enter an email or phone number')
    if (!cleanEmail.includes('@')) return toast.error('Enter a valid Google email address')

    setChecking(true)
    try {
      let profile = accountProfile
      if (!profile) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle()
        profile = data
      }

      // Check admin (SQI-35)
      const isAdmin =
        profile?.role === 'admin' ||
        profile?.role === 'superadmin' ||
        profile?.role === 'staff' ||
        profile?.role === 'financial_staff' ||
        profile?.role === 'support_moderator' ||
        cleanEmail === 'rutilander@gmail.com' ||
        cleanEmail === 'admin@serviceq.ph' ||
        Boolean(localStorage.getItem(`serviceq_admin_password_${cleanEmail}`))

      if (isAdmin) {
        toast.error('This login screen is for customers and providers only.')
        setChecking(false)
        return
      }

      // Check suspended
      if (profile && profile.is_active === false) {
        toast.error('This account has been suspended. Please contact support for assistance.')
        setChecking(false)
        return
      }

      // Check role mismatch
      if (profile && profile.role) {
        if (loginRole === 'customer' && profile.role === 'provider') {
          toast.error('This is a Provider account. Please use the Provider tab to sign in.')
          setChecking(false)
          return
        }
        if (loginRole === 'provider' && profile.role === 'customer') {
          toast.error('This is a Customer account. Please use the Customer tab to sign in.')
          setChecking(false)
          return
        }

        // SQI-25: Rejects manual registration
        let isManualRegistration = false
        const storedMethod = localStorage.getItem(`serviceq_auth_provider_${cleanEmail}`)
        if (storedMethod === 'email') {
          isManualRegistration = true
        } else if (storedMethod !== 'google') {
          try {
            const meta = profile.avatar_url ? JSON.parse(profile.avatar_url) : null
            if (meta?.auth_provider === 'email' || meta?.auth_provider !== 'google') {
              isManualRegistration = true
            }
          } catch {
            isManualRegistration = true
          }
        }

        if (isManualRegistration) {
          toast.error('This email was registered manually with password. Please log in using your email and password.', {
            duration: 6000,
          })
          setChecking(false)
          return
        }

        // Success login
        localStorage.setItem(`serviceq_auth_provider_${cleanEmail}`, 'google')
        toast.success(`Welcome back, ${profile.full_name || profile.email}! 👋`, { id: 'welcome-toast' })
        onSuccessLogin?.(profile)
        onClose()
        return
      }

      // User does NOT exist in system -> Proceed to register (SQI-24)
      localStorage.setItem(`serviceq_auth_provider_${cleanEmail}`, 'google')
      onProceedRegister?.({
        email: cleanEmail,
        role: loginRole,
      })
      onClose()

    } catch (err) {
      console.error('Google auth error:', err)
      toast.error('Could not verify account. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window (Exact match to media_1791988577366.png) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-[480px] bg-[#1e1f20] text-[#e3e3e3] rounded-[28px] p-8 sm:p-10 shadow-2xl border border-[#444746]/20 z-10 selection:bg-[#a8c7fa] selection:text-[#041e49]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition-colors"
          >
            <X size={18} />
          </button>

          {/* Google 4-Color Logo */}
          <div className="mb-6">
            <svg viewBox="0 0 24 24" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>

          {/* VIEW 1: Choose an Account (Notion SQI-24/SQI-25) */}
          {view === 'accounts' && (
            <div>
              <h1 className="text-[26px] font-normal text-[#e3e3e3] tracking-tight">Choose an account</h1>
              <p className="text-[14px] text-[#c4c7c5] mt-1 mb-5">to continue to <span className="font-semibold text-white">ServiceQ</span></p>

              <div className="flex flex-col divide-y divide-[#444746]/40 border-y border-[#444746]/40">
                {savedAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleProcessAccount(acc.email, acc)}
                    disabled={checking}
                    className="flex items-center gap-3.5 py-3 px-2 hover:bg-[#282a2c] rounded-xl text-left transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#a8c7fa] text-[#041e49] font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {acc.full_name ? acc.full_name.charAt(0).toUpperCase() : acc.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-[#e3e3e3] truncate">{acc.full_name || acc.email}</p>
                      <p className="text-[12px] text-[#c4c7c5] truncate">{acc.email}</p>
                    </div>
                  </button>
                ))}

                {/* Use another account option */}
                <button
                  type="button"
                  onClick={() => setView('input')}
                  className="flex items-center gap-3.5 py-3 px-2 hover:bg-[#282a2c] rounded-xl text-left transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full border border-[#8e918f] text-[#c4c7c5] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[#e3e3e3]">Use another account</p>
                  </div>
                </button>
              </div>

              <p className="text-[12px] text-[#c4c7c5] mt-6 leading-relaxed">
                To continue, Google will share your name, email address, language preference, and profile picture with ServiceQ.
              </p>
            </div>
          )}

          {/* VIEW 2: Sign In Input (EXACT MATCH to media_1791988577366.png) */}
          {view === 'input' && (
            <div>
              <h1 className="text-[26px] font-normal text-[#e3e3e3] tracking-tight">Sign in</h1>
              <p className="text-[14px] text-[#c4c7c5] mt-1 mb-6 leading-relaxed">
                with your Google Account. This account will be available to other Google apps in the browser.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleProcessAccount(email)
                }}
                className="space-y-4"
              >
                <div className="relative group">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=" "
                    autoFocus
                    className="peer w-full bg-transparent text-[#e3e3e3] text-base px-3.5 pt-4 pb-3 border border-[#8e918f] rounded-[4px] outline-none focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] transition-all"
                  />
                  <label className="absolute left-3.5 top-3.5 text-[#c4c7c5] text-base transition-all duration-150 pointer-events-none peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#a8c7fa] peer-focus:bg-[#1e1f20] peer-focus:px-1 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#1e1f20] peer-[:not(:placeholder-shown)]:px-1">
                    Email or phone
                  </label>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => toast('Please enter your Google account email to sign in.', { icon: 'ℹ️' })}
                    className="text-[14px] text-[#a8c7fa] hover:underline font-medium"
                  >
                    Forgot email?
                  </button>
                </div>

                <p className="text-[13px] text-[#c4c7c5] pt-4 leading-relaxed">
                  Not your computer? Use Guest mode to sign in privately.{' '}
                  <span className="text-[#a8c7fa] hover:underline cursor-pointer">
                    Learn more about using Guest mode
                  </span>
                </p>

                {/* Bottom Buttons Row */}
                <div className="pt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (savedAccounts.length > 0) setView('accounts')
                      else onClose()
                    }}
                    className="text-[14px] text-[#a8c7fa] hover:bg-[#a8c7fa]/10 px-4 py-2 rounded-full font-medium transition-colors"
                  >
                    {savedAccounts.length > 0 ? 'Back' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={checking || !email.trim()}
                    className="bg-[#a8c7fa] hover:bg-[#b8d4fc] text-[#041e49] font-medium text-[14px] px-6 py-2.5 rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {checking ? (
                      <span className="w-4 h-4 border-2 border-[#041e49] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Next'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

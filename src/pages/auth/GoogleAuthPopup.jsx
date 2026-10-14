import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function GoogleAuthPopup() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithProfile } = useAuth()

  const roleParam = searchParams.get('role') || 'customer'
  const modeParam = searchParams.get('mode') || 'login' // 'login' | 'register'

  const [view, setView] = useState('accounts') // 'accounts' | 'input' | 'role_select'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)

  // Load existing Gmail accounts or detected users for the Google Account Chooser screen
  useEffect(() => {
    document.title = 'Sign in – Google Accounts'

    async function loadAccounts() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, is_active, avatar_url')
          .ilike('email', '%@gmail.com')
          .limit(10)

        if (data && data.length > 0) {
          // Filter out internal admin accounts from public account chooser
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
  }, [])

  const handleProcessAccount = async (targetEmail, accountProfile = null) => {
    const cleanEmail = targetEmail.trim().toLowerCase()
    if (!cleanEmail) return toast.error('Enter an email or phone number')
    if (!cleanEmail.includes('@')) return toast.error('Enter a valid Google email address')

    setLoading(true)
    try {
      // 1. Fetch profile if not already provided
      let profile = accountProfile
      if (!profile) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle()
        profile = data
      }

      // 2. Check for Admin credentials (SQI-35)
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
        setLoading(false)
        return
      }

      // 3. Check for Suspended user
      if (profile && profile.is_active === false) {
        toast.error('This account has been suspended. Please contact support for assistance.')
        setLoading(false)
        return
      }

      // 4. Role mismatch check for existing profile
      if (profile && profile.role) {
        if (roleParam === 'customer' && profile.role === 'provider') {
          toast.error('This is a Provider account. Please use the Provider tab to sign in.')
          setLoading(false)
          return
        }
        if (roleParam === 'provider' && profile.role === 'customer') {
          toast.error('This is a Customer account. Please use the Customer tab to sign in.')
          setLoading(false)
          return
        }

        // 5. SQI-25: If user registered manually with password, reject Google Sign-In
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
          setLoading(false)
          return
        }

        // Valid Google registered account -> Success Login!
        localStorage.setItem(`serviceq_auth_provider_${cleanEmail}`, 'google')
        toast.success(`Welcome back, ${profile.full_name || profile.email}! 👋`, { id: 'welcome-toast' })

        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            isNewUser: false,
            profile,
            email: cleanEmail,
            role: profile.role,
          }, '*')
          window.close()
        } else {
          loginWithProfile(profile)
          const dest = profile.role === 'provider' ? '/provider/dashboard' : '/customer/explore'
          navigate(dest, { replace: true })
        }
        return
      }

      // 6. User does NOT exist in system (SQI-24 Sign-Up Flow)
      setSelectedAccount({ email: cleanEmail })
      localStorage.setItem(`serviceq_auth_provider_${cleanEmail}`, 'google')

      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          isNewUser: true,
          email: cleanEmail,
          role: roleParam,
        }, '*')
        window.close()
      } else {
        navigate(`/register?from=google&role=${roleParam}&email=${encodeURIComponent(cleanEmail)}`, { replace: true })
      }

    } catch (err) {
      console.error('Google auth error:', err)
      toast.error(err.message || 'Failed to authenticate with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#131314] text-[#e3e3e3] flex flex-col justify-between items-center p-4 sm:p-8 font-sans selection:bg-[#a8c7fa] selection:text-[#041e49]">
      <div className="w-full flex-1 flex items-center justify-center">
        {/* Main Card (Matches media_1791988577366.png dark mode) */}
        <div className="w-full max-w-[500px] bg-[#1e1f20] rounded-[28px] p-8 sm:p-10 shadow-2xl border border-[#444746]/20">
          {/* Google 4-Color Logo */}
          <div className="mb-6">
            <svg viewBox="0 0 24 24" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>

          {/* VIEW 1: Choose an Account (Notion SQI-24/25 reference attachment) */}
          {view === 'accounts' && (
            <div>
              <h1 className="text-[28px] font-normal text-[#e3e3e3] tracking-tight">Choose an account</h1>
              <p className="text-[15px] text-[#c4c7c5] mt-1 mb-6">to continue to <span className="font-semibold text-white">ServiceQ</span></p>

              <div className="flex flex-col divide-y divide-[#444746]/40 border-y border-[#444746]/40">
                {savedAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleProcessAccount(acc.email, acc)}
                    disabled={loading}
                    className="flex items-center gap-4 py-3.5 px-2 hover:bg-[#282a2c] rounded-xl text-left transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#a8c7fa] text-[#041e49] font-bold text-base flex items-center justify-center flex-shrink-0">
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
                  className="flex items-center gap-4 py-3.5 px-2 hover:bg-[#282a2c] rounded-xl text-left transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full border border-[#8e918f] text-[#c4c7c5] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[#e3e3e3]">Use another account</p>
                  </div>
                </button>
              </div>

              <p className="text-[12px] text-[#c4c7c5] mt-8 leading-relaxed">
                To continue, Google will share your name, email address, language preference, and profile picture with ServiceQ.
              </p>
            </div>
          )}

          {/* VIEW 2: Sign In Input (EXACT MATCH to media_1791988577366.png) */}
          {view === 'input' && (
            <div>
              <h1 className="text-[28px] font-normal text-[#e3e3e3] tracking-tight">Sign in</h1>
              <p className="text-[15px] text-[#c4c7c5] mt-1 mb-8 leading-relaxed">
                with your Google Account. This account will be available to other Google apps in the browser.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleProcessAccount(email)
                }}
                className="space-y-4"
              >
                {/* Outlined Material Text Input */}
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

                <p className="text-[13px] text-[#c4c7c5] pt-6 leading-relaxed">
                  Not your computer? Use Guest mode to sign in privately.{' '}
                  <span className="text-[#a8c7fa] hover:underline cursor-pointer">
                    Learn more about using Guest mode
                  </span>
                </p>

                {/* Bottom Buttons Row */}
                <div className="pt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (savedAccounts.length > 0) setView('accounts')
                      else navigate('/register')
                    }}
                    className="text-[14px] text-[#a8c7fa] hover:bg-[#a8c7fa]/10 px-4 py-2 rounded-full font-medium transition-colors"
                  >
                    {savedAccounts.length > 0 ? 'Back' : 'Create account'}
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="bg-[#a8c7fa] hover:bg-[#b8d4fc] text-[#041e49] font-medium text-[14px] px-6 py-2.5 rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-[#041e49] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Next'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer (English, Help, Privacy, Terms) */}
      <div className="w-full max-w-[500px] flex items-center justify-between text-[12px] text-[#c4c7c5] px-4 py-4">
        <div className="flex items-center gap-1 cursor-pointer hover:text-white">
          <span>English (United States)</span>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </div>

        <div className="flex items-center gap-6">
          <a href="https://support.google.com" target="_blank" rel="noreferrer" className="hover:text-white">Help</a>
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="hover:text-white">Privacy</a>
          <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="hover:text-white">Terms</a>
        </div>
      </div>
    </div>
  )
}

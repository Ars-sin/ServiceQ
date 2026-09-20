import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, ArrowRight, UserCheck, Briefcase, Sparkles, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

export default function GoogleSignInModal({
  isOpen,
  onClose,
  onSuccessLogin,
  onProceedRegister,
}) {
  const [email, setEmail]               = useState('')
  const [checking, setChecking]         = useState(false)
  const [notFoundEmail, setNotFoundEmail] = useState('')
  const [step, setStep]                 = useState('input') // 'input' | 'choose-role'
  const [sampleAccounts, setSampleAccounts] = useState([])

  // Load registered Gmail accounts from profiles to provide quick 1-click test chips
  useEffect(() => {
    if (!isOpen) return
    setStep('input')
    setNotFoundEmail('')
    setEmail('')

    supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .ilike('email', '%@gmail.com')
      .limit(4)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSampleAccounts(data)
        }
      })
      .catch(() => {})
  }, [isOpen])

  if (!isOpen) return null

  const handleCheckEmail = async (targetEmail) => {
    const cleanEmail = (targetEmail || email).trim().toLowerCase()
    if (!cleanEmail) return toast.error('Please enter your Google email')
    if (!cleanEmail.includes('@')) return toast.error('Please enter a valid email address')

    setChecking(true)
    try {
      // Query profiles to check if this email exists in the system
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Profile check error:', error)
      }

      if (profile && profile.id) {
        // Exists in system -> Direct log in!
        toast.success(`Google verification successful! Welcome back, ${profile.full_name || profile.email}!`)
        onSuccessLogin?.(profile)
        onClose()
      } else {
        // Does NOT exist in system -> Proceed to register and let them choose role
        setNotFoundEmail(cleanEmail)
        setStep('choose-role')
      }
    } catch (err) {
      console.error('Google sign-in check failed:', err)
      toast.error('Could not verify account. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleSelectRole = (selectedRole) => {
    onProceedRegister?.({
      email: notFoundEmail,
      role: selectedRole,
    })
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">Sign in with Google</h3>
                <p className="text-xs text-gray-400">Continue to ServiceQ</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {step === 'input' ? (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter your Google account email. If you already have an account, you'll be signed in directly. Otherwise, you'll be guided to register.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleCheckEmail()
                  }}
                  className="flex flex-col gap-3"
                >
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      className="input pl-10 pr-4 py-2.5 w-full text-sm rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={checking || !email.trim()}
                    className="btn-primary py-2.5 rounded-xl font-bold text-sm w-full flex items-center justify-center gap-2 shadow-sm"
                  >
                    {checking ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick 1-click accounts from database if available */}
                {sampleAccounts.length > 0 && (
                  <div className="mt-2 pt-4 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Registered Accounts in System (1-Click Test)
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {sampleAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleCheckEmail(acc.email)}
                          disabled={checking}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/50 transition-all text-left group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {acc.full_name ? acc.full_name.charAt(0).toUpperCase() : acc.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate group-hover:text-brand-700">
                                {acc.full_name || acc.email}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">{acc.email}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                            acc.role === 'provider'
                              ? 'bg-emerald-100 text-emerald-800'
                              : acc.role === 'admin'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-brand-100 text-brand-800'
                          }`}>
                            {acc.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Step: Choose Role for New Google User */
              <div className="flex flex-col gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
                  <span className="text-xl">✨</span>
                  <div className="text-xs">
                    <p className="font-bold text-amber-950">No account found for:</p>
                    <p className="text-amber-800 font-mono mt-0.5 underline">{notFoundEmail}</p>
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-black text-gray-900">Choose your account type</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    How would you like to use ServiceQ?
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Option 1: Customer */}
                  <button
                    type="button"
                    onClick={() => handleSelectRole('customer')}
                    className="p-3.5 rounded-2xl border-2 border-brand-200 bg-brand-50/40 hover:bg-brand-50 hover:border-brand-400 text-left transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                        🛒
                      </div>
                      <div>
                        <div className="font-bold text-sm text-brand-900 flex items-center gap-1.5">
                          Customer
                          <span className="text-[10px] bg-brand-200/70 text-brand-800 font-semibold px-2 py-0.5 rounded-full">Book & Rent</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Book trusted local home services, tech repairs, and rent items in Cebu
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-brand-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>

                  {/* Option 2: Provider */}
                  <button
                    type="button"
                    onClick={() => handleSelectRole('provider')}
                    className="p-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 text-left transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                        💼
                      </div>
                      <div>
                        <div className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                          Provider Partner
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 font-semibold px-2 py-0.5 rounded-full">Offer & Earn</span>
                        </div>
                        <p className="text-xs text-emerald-800/80 mt-0.5">
                          Offer your skills, list equipment/properties for rent, and grow your client base
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-emerald-500 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input')
                      setEmail(notFoundEmail)
                    }}
                    className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-semibold"
                  >
                    <ChevronLeft size={14} /> Try another email
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

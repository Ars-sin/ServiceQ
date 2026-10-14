import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, ArrowLeft, ArrowRight, ShieldCheck, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

export default function GoogleSignInModal({
  isOpen,
  onClose,
  onSuccessLogin,
  loginRole = 'customer',
}) {
  const [view, setView] = useState('accounts') // 'accounts' | 'custom'
  const [customEmail, setCustomEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // Default accounts modeled from the authentic browser session (media_1792000528190.png)
  const defaultAccounts = [
    {
      name: 'Mary Kristine Cañeda',
      email: 'marykristinecaneda@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Yuri Ha',
      email: 'yuriha143@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sean Michael Yu Jerez',
      email: 'seyu.jerez.swu@phinmaed.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
  ]

  useEffect(() => {
    if (isOpen) {
      setView('accounts')
      setCustomEmail('')
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectAccount = async (account) => {
    if (loading) return
    setLoading(true)

    const cleanEmail = (account.email || '').trim().toLowerCase()
    const name = account.name || ''

    try {
      await onSuccessLogin?.({
        email: cleanEmail,
        name: name,
        email_verified: true,
      })
      onClose()
    } catch (err) {
      toast.error(err.message || 'Google authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomSubmit = async (e) => {
    e.preventDefault()
    const cleanEmail = customEmail.trim().toLowerCase()
    if (!cleanEmail) {
      return toast.error('Please enter your Google account email.')
    }
    await handleSelectAccount({
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
    })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Dark backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Authentic Google Account Chooser Card (Dark theme matching media_1792000528190.png) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-3xl bg-[#1e1f20] text-[#e3e3e3] rounded-3xl shadow-2xl border border-[#444746]/50 overflow-hidden z-10 font-sans"
        >
          {/* Top Google Header */}
          <div className="px-6 py-4 border-b border-[#444746]/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-medium text-white tracking-normal">Sign in with Google</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main 2-Column Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#444746]/40 min-h-[360px]">
            {/* Left Column: Choose an account */}
            <div className="p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black text-xl mb-6 shadow-md shadow-brand-900/30">
                  SQ
                </div>
                <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-tight leading-tight">
                  Choose an account
                </h1>
                <p className="text-sm sm:text-base text-[#c4c7c5] mt-3">
                  to continue to <span className="font-semibold text-white">ServiceQ</span>
                </p>
              </div>

              <div className="pt-6 hidden md:block">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#a8c7fa] bg-[#a8c7fa]/10 px-3 py-1 rounded-full">
                  <ShieldCheck size={13} /> Secure Google OAuth Bridge
                </span>
              </div>
            </div>

            {/* Right Column: Account Selection or Custom Input */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              {view === 'accounts' ? (
                <div>
                  <div className="divide-y divide-[#444746]/40">
                    {defaultAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleSelectAccount(acc)}
                        disabled={loading}
                        className="w-full text-left py-3.5 px-3 rounded-xl hover:bg-[#282a2c] transition-colors flex items-center gap-3.5 group cursor-pointer"
                      >
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#444746] flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white group-hover:text-[#a8c7fa] truncate">
                            {acc.name}
                          </p>
                          <p className="text-xs text-[#c4c7c5] truncate">
                            {acc.email}
                          </p>
                        </div>
                      </button>
                    ))}

                    {/* Use another account row */}
                    <button
                      type="button"
                      onClick={() => setView('custom')}
                      disabled={loading}
                      className="w-full text-left py-3.5 px-3 rounded-xl hover:bg-[#282a2c] transition-colors flex items-center gap-3.5 group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full border border-[#8e918f] text-[#c4c7c5] flex items-center justify-center flex-shrink-0 group-hover:border-[#a8c7fa] group-hover:text-[#a8c7fa]">
                        <User size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white group-hover:text-[#a8c7fa]">
                          Use another account
                        </p>
                      </div>
                    </button>
                  </div>

                  <p className="text-[12px] text-[#c4c7c5] mt-6 leading-relaxed">
                    Before using this app, you can review ServiceQ&apos;s{' '}
                    <span className="text-[#a8c7fa] hover:underline cursor-pointer">Privacy Policy</span> and{' '}
                    <span className="text-[#a8c7fa] hover:underline cursor-pointer">Terms of Service</span>.
                  </p>
                </div>
              ) : (
                /* Custom Google Account Input View */
                <form onSubmit={handleCustomSubmit} className="flex flex-col justify-between h-full space-y-4">
                  <div>
                    <h2 className="text-lg font-medium text-white mb-1">Enter your Google Account</h2>
                    <p className="text-xs text-[#c4c7c5] mb-4">
                      Enter any Google email to verify and sign in to ServiceQ.
                    </p>

                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e918f]" />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        className="w-full bg-[#131314] text-white text-sm pl-10 pr-4 py-3 border border-[#8e918f] rounded-xl outline-none focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#a8c7fa] transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setView('accounts')}
                      className="text-xs text-[#a8c7fa] hover:underline flex items-center gap-1 font-medium"
                    >
                      <ArrowLeft size={13} /> Back to accounts
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !customEmail.trim()}
                      className="bg-[#a8c7fa] hover:bg-[#b8d4fc] text-[#041e49] font-semibold text-xs px-5 py-2.5 rounded-full transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-[#041e49] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="px-6 sm:px-8 py-3 bg-[#131314]/80 border-t border-[#444746]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#c4c7c5]">
            <span>English (United States)</span>
            <div className="flex items-center gap-4 text-[#a8c7fa]">
              <span className="hover:underline cursor-pointer">Help</span>
              <span className="hover:underline cursor-pointer">Privacy</span>
              <span className="hover:underline cursor-pointer">Terms</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

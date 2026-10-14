import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Key, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getGoogleClientId, setGoogleClientId, launchGoogleSignIn, handleGoogleAuthSuccess } from '@/lib/googleAuth'

export default function GoogleSignInModal({
  isOpen,
  onClose,
  onSuccessLogin,
  onProceedRegister,
  loginRole = 'customer',
}) {
  const [clientIdInput, setClientIdInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setClientIdInput(getGoogleClientId())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSaveAndLaunch = async e => {
    e.preventDefault()
    const cleanId = clientIdInput.trim()
    if (!cleanId) {
      toast.error('Please enter your Google OAuth Client ID.')
      return
    }

    setGoogleClientId(cleanId)
    setLoading(true)

    try {
      await launchGoogleSignIn({
        role: loginRole,
        onSuccess: async (userInfo) => {
          onClose()
          if (onSuccessLogin) {
            onSuccessLogin(userInfo)
          }
        },
        onError: (err) => {
          setLoading(false)
          toast.error(err.message || 'Google Sign-In failed.')
        },
      })
    } catch (err) {
      setLoading(false)
      toast.error(err.message || 'Could not launch Google Sign-In.')
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 sm:p-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Connect Google API</h3>
              <p className="text-xs text-slate-500">Sign in purely from Google&apos;s official API (accounts.google.com)</p>
            </div>
          </div>

          <form onSubmit={handleSaveAndLaunch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Key size={14} className="text-brand-600" />
                <span>Google OAuth 2.0 Client ID</span>
              </label>
              <input
                type="text"
                required
                value={clientIdInput}
                onChange={e => setClientIdInput(e.target.value)}
                placeholder="xxxxxx-xxxxxxxx.apps.googleusercontent.com"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400 font-mono text-xs"
              />
            </div>

            {/* Quick steps instruction */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span>How to get your Google Client ID:</span>
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                <li>
                  Open{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 font-medium underline inline-flex items-center gap-0.5"
                  >
                    Google Cloud Credentials <ExternalLink size={11} />
                  </a>
                </li>
                <li>Click <strong>Create Credentials &gt; OAuth client ID</strong> (Web application)</li>
                <li>Add authorized JavaScript origin: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">{window.location.origin}</code></li>
                <li>Paste the generated Client ID above.</li>
              </ol>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !clientIdInput.trim()}
                className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting Google...</span>
                  </>
                ) : (
                  <span>Launch Google Sign-In</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

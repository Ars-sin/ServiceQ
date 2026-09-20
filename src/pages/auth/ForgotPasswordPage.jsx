import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, ShieldCheck, RefreshCw, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

const STEPS = ['Enter Email', 'Verify OTP', 'New Password']

export default function ForgotPasswordPage() {
  const [step, setStep]                 = useState(1)
  const [email, setEmail]               = useState('')
  const [otp, setOtp]                   = useState(['', '', '', '', '', ''])
  const [passwords, setPasswords]       = useState({ newPw: '', confirmPw: '' })
  const [loading, setLoading]           = useState(false)
  const [resendCooldown, setCooldown]   = useState(0)
  const inputRefs                       = useRef([])

  // Listen for direct recovery link clicks in email
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        toast.success('Email verified via recovery link! Please set your new password.')
        setStep(3)
      }
    })
    return () => subscription?.unsubscribe()
  }, [])

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...otp]
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]
    }
    setOtp(next)
    const nextFocusIndex = Math.min(pasted.length, 5)
    inputRefs.current[nextFocusIndex]?.focus()
  }

  // ── Step 1: Send Password Reset OTP to Email ─────────────────────────────
  const handleSendOtp = async e => {
    e.preventDefault()
    const cleanEmail = email.trim()
    if (!cleanEmail) return toast.error('Please enter your email')

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail)
      if (error) throw error

      toast.success(`6-digit OTP sent to ${cleanEmail}! Check your inbox.`)
      setCooldown(60)
      setStep(2)
      setTimeout(() => inputRefs.current[0]?.focus(), 150)
    } catch (err) {
      console.error('Password reset request error:', err)
      toast.error(err.message || 'Failed to send OTP. Please check your email.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify 6-digit OTP ───────────────────────────────────────────
  const handleVerifyOtp = async e => {
    e.preventDefault()
    const token = otp.join('').trim()
    if (token.length < 6) return toast.error('Please enter the complete 6-digit OTP code')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: 'recovery',
      })
      if (error) throw error

      toast.success('Email verified! Please enter your new password.')
      setStep(3)
    } catch (err) {
      console.error('Verify recovery OTP error:', err)
      toast.error(err.message || 'Invalid or expired OTP code. Please check your email or resend.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
      if (error) throw error
      toast.success('Fresh OTP code sent to your email!')
      setCooldown(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Set New Password ─────────────────────────────────────────────
  const handleResetPassword = async e => {
    e.preventDefault()
    if (passwords.newPw !== passwords.confirmPw) return toast.error('Passwords do not match')
    if (passwords.newPw.length < 6) return toast.error('Password must be at least 6 characters')

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPw,
      })
      if (error) throw error

      toast.success('Password updated successfully!')
      setStep(4)
    } catch (err) {
      console.error('Update password error:', err)
      toast.error(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative py-12">
      {/* ── Prominent Fixed/Floating Top Back Button ── */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-brand-600 hover:border-brand-300 font-semibold text-xs sm:text-sm shadow-sm transition-all hover:-translate-x-0.5 active:scale-95 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="ServiceQ" className="h-20 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 text-xs mt-0.5">Secure email verification with one-time code</p>
        </div>

        <div className="card shadow-modal border border-gray-100">
          {/* Step indicator */}
          {step < 4 && (
            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i + 1 < step ? 'bg-brand-600 text-white' :
                    i + 1 === step ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                    'bg-gray-200 text-gray-400'
                  }`}>{i + 1 < step ? '✓' : i + 1}</div>
                  <div className="flex-1">
                    <div className={`text-xs font-medium ${i + 1 === step ? 'text-brand-600' : 'text-gray-400'}`}>{s}</div>
                  </div>
                  {i < 2 && <div className={`w-4 h-px ${i + 1 < step ? 'bg-brand-400' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── STEP 1: Enter Email ─────────────────────────────────── */}
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl p-3 text-brand-800 text-xs">
                  <KeyRound size={18} className="text-brand-600 flex-shrink-0" />
                  <span>Enter your registered email address. We will send a 6-digit OTP code to verify your identity.</span>
                </div>

                <div className="form-group">
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@email.com"
                      className="input pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-1">
                  <Link
                    to="/login"
                    className="btn-secondary flex-1 py-3 flex items-center justify-center gap-1.5 font-semibold text-sm hover:bg-gray-100"
                  >
                    <ArrowLeft size={16} /> Back
                  </Link>
                  <button type="submit" disabled={loading} className="btn-primary btn-lg flex-1 font-bold shadow-sm">
                    {loading
                      ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : 'Send 6-Digit OTP'}
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── STEP 2: Verify OTP ──────────────────────────────────── */}
            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck size={26} />
                  </div>
                  <h2 className="font-bold text-gray-900 text-base">Check your email</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    We sent a 6-digit code to <strong className="text-gray-800">{email}</strong>
                  </p>
                </div>

                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      value={d}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                      maxLength={1}
                      inputMode="numeric"
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading
                    ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Verify Code'}
                </button>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="hover:text-brand-600 inline-flex items-center gap-1"
                  >
                    <ArrowLeft size={13} /> Change email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className={`font-semibold ${
                      resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-brand-600 hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── STEP 3: Set New Password ────────────────────────────── */}
            {step === 3 && (
              <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>Email verified! You can now choose a new secure password.</span>
                </div>

                <div className="form-group">
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={passwords.newPw}
                    onChange={e => setPasswords(p => ({ ...p, newPw: e.target.value }))}
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Retype new password"
                    value={passwords.confirmPw}
                    onChange={e => setPasswords(p => ({ ...p, confirmPw: e.target.value }))}
                    className="input"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading
                    ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Update Password'}
                </button>
              </motion.form>
            )}

            {/* ── STEP 4: Success ─────────────────────────────────────── */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle size={36} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Password Reset Complete!</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Your password has been successfully updated. You can now log in with your new credentials.
                  </p>
                </div>
                <Link to="/login" className="btn-primary w-full py-2.5 text-center">
                  Sign In to ServiceQ
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 && (
            <div className="mt-4 text-center">
              <Link to="/login" className="btn-ghost w-full text-xs inline-flex items-center justify-center gap-1.5 text-gray-500">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

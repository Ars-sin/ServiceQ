import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [passwords, setPasswords] = useState({ newPw: '', confirmPw: '' })
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }

  const handleSendOtp = async e => {
    e.preventDefault()
    if (!email) return toast.error('Enter your email')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    toast.success('OTP sent to your email!')
    setStep(2)
  }

  const handleVerifyOtp = e => {
    e.preventDefault()
    if (otp.join('').length < 6) return toast.error('Enter the 6-digit OTP')
    setStep(3)
  }

  const handleResetPassword = async e => {
    e.preventDefault()
    if (passwords.newPw !== passwords.confirmPw) return toast.error('Passwords do not match')
    if (passwords.newPw.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    toast.success('Password reset successful!')
    setStep(4)
  }

  const steps = ['Enter Email', 'Verify OTP', 'New Password']

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="ServiceQ" className="h-20 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
        </div>

        <div className="card shadow-modal">
          {/* Step indicator */}
          {step < 4 && (
            <div className="flex items-center gap-2 mb-6">
              {steps.map((s, i) => (
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
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <p className="text-sm text-gray-500">Enter your registered email to receive a verification code.</p>
                <div className="form-group">
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required placeholder="you@email.com" className="input pl-9" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send OTP'}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                <p className="text-sm text-gray-500">Enter the 6-digit code sent to <strong>{email}</strong></p>
                <div className="flex justify-center gap-2">
                  {otp.map((d, i) => (
                    <input key={i} ref={el => inputRefs.current[i] = el}
                      value={d} onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                      maxLength={1} inputMode="numeric" />
                  ))}
                </div>
                <button type="submit" className="btn-primary w-full">Verify Code</button>
                <button type="button" onClick={() => setStep(1)} className="btn-ghost w-full text-sm">
                  <ArrowLeft size={14} /> Back
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <p className="text-sm text-gray-500">Choose a strong new password.</p>
                <div className="form-group">
                  <label className="label">New Password</label>
                  <input type="password" required minLength={8} placeholder="Minimum 8 characters"
                    value={passwords.newPw} onChange={e => setPasswords(p => ({ ...p, newPw: e.target.value }))}
                    className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Confirm New Password</label>
                  <input type="password" required placeholder="Retype password"
                    value={passwords.confirmPw} onChange={e => setPasswords(p => ({ ...p, confirmPw: e.target.value }))}
                    className="input" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Reset Password'}
                </button>
              </motion.form>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={36} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Password Reset!</h2>
                  <p className="text-sm text-gray-500 mt-1">Your password has been updated successfully.</p>
                </div>
                <Link to="/login" className="btn-primary w-full">Back to Login</Link>
              </motion.div>
            )}
          </AnimatePresence>

          {step < 4 && (
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-gray-500 hover:text-brand-600 flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, Lock, Eye, EyeOff, MapPin, ChevronRight, ChevronLeft, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import LocationPicker from '@/components/ui/LocationPicker'

const STEPS = ['Account Info', 'Location', 'Password', 'Verify Email']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep]                   = useState(0)
  const [role, setRole]                   = useState('customer')
  const [showPw, setShowPw]               = useState(false)
  const [agreed, setAgreed]               = useState(false)
  const [loading, setLoading]             = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendCooldown, setCooldown]     = useState(0)
  const [resending, setResending]         = useState(false)

  const [otp, setOtp]       = useState(['', '', '', '', '', ''])
  const inputRefs           = useRef([])

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    password: '', confirmPassword: '',
  })

  const [location, setLocation] = useState({
    address:    '',
    barangay:   '',
    city:       '',
    province:   '',
    postalCode: '',
    lat:        null,
    lng:        null,
  })

  // Listen for email link confirmations
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        if (step === 3) {
          toast.success('Email confirmed! Welcome to ServiceQ 🎉')
          navigate(role === 'provider' ? '/provider/onboarding' : '/customer/explore', { replace: true })
        }
      }
    })
    return () => subscription?.unsubscribe()
  }, [step, role, navigate])

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

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

  // ── Step validation ────────────────────────────────────────────────────
  const validateStep0 = () => {
    if (!form.fullName.trim()) return toast.error('Please enter your full name') || false
    if (!form.email.trim())    return toast.error('Please enter your email')     || false
    if (!form.phone.trim())    return toast.error('Please enter your phone number') || false
    return true
  }

  const validateStep1 = () => {
    if (!location.city.trim()) {
      toast.error('Please search and select your location')
      return false
    }
    return true
  }

  const nextStep = () => {
    if (step === 0 && !validateStep0()) return
    if (step === 1 && !validateStep1()) return
    setStep(s => s + 1)
  }

  // ── Submit Account Details & Trigger Verification ─────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    if (form.password.length < 6)               return toast.error('Password must be at least 6 characters')
    if (!agreed)                                 return toast.error('Please accept the Terms & Conditions')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone,
            role,
          }
        },
      })

      if (error) throw error

      // Save initial profile details
      if (data?.user?.id) {
        await supabase
          .from('profiles')
          .upsert({
            id:          data.user.id,
            email:       form.email.trim(),
            full_name:   form.fullName,
            phone:       form.phone,
            role:        role || 'customer',
            address:     location.address,
            barangay:    location.barangay,
            city:        location.city,
            province:    location.province,
            postal_code: location.postalCode,
          }, { onConflict: 'id' })
      }

      // Cache registration data for onboarding
      try {
        sessionStorage.setItem('serviceq_reg_data', JSON.stringify({
          fullName: form.fullName,
          email: form.email.trim(),
          phone: form.phone,
          address: location.address,
          barangay: location.barangay,
          city: location.city,
          province: location.province,
          postalCode: location.postalCode,
        }))
      } catch {}

      toast.success(`Verification code sent to ${form.email}!`)
      setStep(3)
      setCooldown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 200)

    } catch (err) {
      console.error('Registration error:', err)
      toast.error(err.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Verify 6-digit OTP from Email ─────────────────────────────────────
  const handleVerifyOtp = async e => {
    e?.preventDefault()
    const token = otp.join('').trim()
    if (token.length < 6) return toast.error('Please enter the complete 6-digit verification code')

    setVerifyLoading(true)
    try {
      const cleanEmail = form.email.trim()

      // 1. Try verify with type: 'signup'
      let verifyResult = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: 'signup',
      })

      // 2. Fallback to type: 'email' if signup token format is standard email OTP
      if (verifyResult.error) {
        verifyResult = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token,
          type: 'email',
        })
      }

      if (verifyResult.error) throw verifyResult.error

      toast.success('Email verified successfully! Welcome to ServiceQ 🎉')
      navigate(role === 'provider' ? '/provider/onboarding' : '/customer/explore', { replace: true })

    } catch (err) {
      console.error('Email verification error:', err)
      toast.error(err.message || 'Invalid or expired verification code. Please check your inbox.')
    } finally {
      setVerifyLoading(false)
    }
  }

  // ── Resend Verification Code ──────────────────────────────────────────
  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    try {
      const cleanEmail = form.email.trim()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      })
      if (error) throw error

      toast.success(`Fresh verification code sent to ${cleanEmail}!`)
      setCooldown(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      console.error('Resend error:', err)
      toast.error(err.message || 'Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-10">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }} className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="ServiceQ" className="h-20 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-bold text-brand-700">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the ServiceQ community in Cebu</p>
        </div>

        <div className="card shadow-modal">
          {/* Role selector (hidden on verification step) */}
          {step < 3 && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { id: 'customer', label: '🛒 I want to Book',  sub: 'Customer' },
                { id: 'provider', label: '💼 I want to Offer', sub: 'Provider' },
              ].map(opt => (
                <button key={opt.id} type="button" onClick={() => setRole(opt.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    role === opt.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}>
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs text-gray-400">{opt.sub}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step progress */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  i < step  ? 'bg-brand-600 text-white' :
                  i === step ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[11px] font-medium hidden sm:block ${i === step ? 'text-brand-600' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-brand-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP 0: Account Info ──────────────────────────────── */}
            {step === 0 && (
              <motion.div key="step0"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4">
                {/* Full Name */}
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input name="fullName" required value={form.fullName} onChange={handleChange}
                      placeholder="Juan dela Cruz" className="input pl-9" />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input name="email" type="email" required value={form.email} onChange={handleChange}
                      placeholder="you@email.com" className="input pl-9" />
                  </div>
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="label">Contact Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                      placeholder="09xxxxxxxxx" className="input pl-9" />
                  </div>
                </div>

                <button type="button" onClick={nextStep}
                  className="btn-primary btn-lg w-full flex items-center justify-center gap-2">
                  Next: Set Location <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ── STEP 1: Location ──────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4">
                <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                  <MapPin size={15} className="text-brand-600 flex-shrink-0" />
                  <p className="text-xs text-brand-700">
                    Your location helps providers find you and lets you discover nearby listings.
                  </p>
                </div>

                <LocationPicker
                  value={location}
                  onChange={setLocation}
                  label="Search your location in Cebu"
                />

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(0)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-1">
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button type="button" onClick={nextStep}
                    className="btn-primary flex-1 flex items-center justify-center gap-2">
                    Next: Password <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Password ──────────────────────────────────── */}
            {step === 2 && (
              <motion.form key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Password */}
                <div className="form-group">
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input name="password" type={showPw ? 'text' : 'password'} required
                      value={form.password} onChange={handleChange} placeholder="••••••••"
                      className="input pl-9 pr-10" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label className="label">Confirm Password</label>
                  <input name="confirmPassword" type="password" required
                    value={form.confirmPassword} onChange={handleChange}
                    placeholder="••••••••" className="input" />
                </div>

                {/* Agree */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 accent-brand-600" />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <button type="button" className="text-brand-600 hover:underline">Terms & Conditions</button>
                  </span>
                </label>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-1">
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="btn-primary btn-lg flex-1">
                    {loading
                      ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : 'Send Verification Code →'
                    }
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── STEP 3: Verify Email OTP ───────────────────────────── */}
            {step === 3 && (
              <motion.form key="step3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2.5">
                    <ShieldCheck size={32} />
                  </div>
                  <h2 className="font-bold text-gray-900 text-lg">Verify your email address</h2>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    We sent a 6-digit confirmation code to <strong className="text-gray-800 break-all">{form.email}</strong>. Enter the code below to confirm this is a verified email.
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

                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="btn-primary btn-lg w-full font-bold shadow-sm"
                >
                  {verifyLoading
                    ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Verify & Activate Account'}
                </button>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="hover:text-brand-600 inline-flex items-center gap-1"
                  >
                    <ArrowLeft size={13} /> Change email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || resending}
                    className={`font-semibold ${
                      resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-brand-600 hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {step < 3 && (
            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, Lock, Eye, EyeOff, MapPin, ChevronRight, ChevronLeft,
  ShieldCheck, ArrowLeft, Briefcase, Building2, Wrench, Package, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import LocationPicker from '@/components/ui/LocationPicker'

const STEPS = ['Account Info', 'Location', 'Password', 'Verify Email']

const CEBU_COVERAGE_AREAS = [
  'Cebu City', 'Mandaue City', 'Lapu-Lapu City', 'Talisay City',
  'Consolacion', 'Liloan', 'Minglanilla', 'Cordova'
]

const PROVIDER_CATEGORIES = [
  'Cleaning & Home Care',
  'Aircon, Appliance & Tech Repair',
  'Gadgets & Electronics Rental',
  'Rental Properties & Spaces',
  'Vehicle & Transport Rentals',
  'Events & Party Equipment',
  'Tutoring & Academic Lessons',
  'Beauty, Wellness & Personal Care',
  'Photography & Videography',
  'Carpentry, Plumbing & Handyman',
  'Other Local Service / Rental',
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer'

  const [step, setStep]                   = useState(0)
  const [role, setRole]                   = useState(initialRole)
  const [showPw, setShowPw]               = useState(false)
  const [agreed, setAgreed]               = useState(false)
  const [loading, setLoading]             = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendCooldown, setCooldown]     = useState(0)
  const [resending, setResending]         = useState(false)

  const [otp, setOtp]       = useState(['', '', '', '', '', ''])
  const inputRefs           = useRef([])

  // Basic form
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    password: '', confirmPassword: '',
  })

  // Provider-specific details
  const [providerDetails, setProviderDetails] = useState({
    businessName: '',
    providerType: 'service', // 'service' | 'rental' | 'both'
    category: 'Cleaning & Home Care',
    yearsExp: '1',
    serviceCoverage: ['Cebu City', 'Mandaue City', 'Lapu-Lapu City'],
  })

  // Location
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

  const handleRoleChange = (newRole) => {
    if (newRole === role) return
    setRole(newRole)
    setStep(0)
    setForm({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    })
    setProviderDetails({
      businessName: '',
      providerType: 'service',
      category: 'Cleaning & Home Care',
      yearsExp: '1',
      serviceCoverage: ['Cebu City', 'Mandaue City', 'Lapu-Lapu City'],
    })
    setLocation({
      address: '',
      barangay: '',
      city: '',
      province: '',
      postalCode: '',
      lat: null,
      lng: null,
    })
    setAgreed(false)
    setShowPw(false)
    setOtp(['', '', '', '', '', ''])
  }

  const handleProviderDetailChange = (key, val) => {
    setProviderDetails(prev => ({ ...prev, [key]: val }))
  }

  const toggleCoverageArea = (area) => {
    setProviderDetails(prev => {
      const exists = prev.serviceCoverage.includes(area)
      const updated = exists
        ? prev.serviceCoverage.filter(a => a !== area)
        : [...prev.serviceCoverage, area]
      return { ...prev, serviceCoverage: updated }
    })
  }

  const selectAllCoverage = () => {
    setProviderDetails(prev => ({
      ...prev,
      serviceCoverage: prev.serviceCoverage.length === CEBU_COVERAGE_AREAS.length ? [] : [...CEBU_COVERAGE_AREAS]
    }))
  }

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
    if (role === 'provider' && !providerDetails.businessName.trim()) {
      return toast.error('Please enter your business or trade name') || false
    }
    if (!form.fullName.trim()) return toast.error('Please enter your full name') || false
    if (!form.email.trim())    return toast.error('Please enter your email address') || false
    if (!form.phone.trim())    return toast.error('Please enter your contact phone number') || false
    return true
  }

  const validateStep1 = () => {
    if (!location.city.trim()) {
      toast.error('Please search and select your base location')
      return false
    }
    if (role === 'provider' && providerDetails.serviceCoverage.length === 0) {
      toast.error('Please select at least one Cebu service coverage area')
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
    if (!agreed) {
      return toast.error(role === 'provider'
        ? 'Please accept the ServiceQ Provider Partnership Terms'
        : 'Please accept the Terms & Conditions'
      )
    }

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
            business_name: role === 'provider' ? (providerDetails.businessName || form.fullName) : null,
            provider_type: role === 'provider' ? [providerDetails.providerType] : null,
            category: role === 'provider' ? providerDetails.category : null,
            service_area: role === 'provider' ? providerDetails.serviceCoverage.join(', ') : null,
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

        // If registering as a provider, create initial provider entry
        if (role === 'provider') {
          try {
            await supabase.from('providers').upsert({
              user_id: data.user.id,
              business_name: providerDetails.businessName || form.fullName,
              business_description: `Category: ${providerDetails.category} | ${providerDetails.yearsExp} year(s) experience`,
              provider_type: [providerDetails.providerType],
              years_experience: parseInt(providerDetails.yearsExp) || 1,
              service_area: providerDetails.serviceCoverage.join(', ') || location.city || 'Cebu',
              kyc_status: 'under_verification',
              provider_status: 'active',
            }, { onConflict: 'user_id' })
          } catch (provErr) {
            console.warn('Initial provider table entry note:', provErr)
          }
        }
      }

      // Cache registration data for onboarding
      try {
        sessionStorage.setItem('serviceq_reg_data', JSON.stringify({
          fullName: form.fullName,
          email: form.email.trim(),
          phone: form.phone,
          role,
          businessName: providerDetails.businessName,
          providerType: providerDetails.providerType,
          category: providerDetails.category,
          yearsExp: providerDetails.yearsExp,
          serviceCoverage: providerDetails.serviceCoverage,
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

      // 2. Fallback to type: 'email'
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12 relative">
      {/* ── Prominent Fixed/Floating Top Back Button ── */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-brand-600 hover:border-brand-300 font-semibold text-xs sm:text-sm shadow-sm transition-all hover:-translate-x-0.5 active:scale-95 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Logo & Dynamic Header */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="ServiceQ" className="h-20 w-auto object-contain mb-3" />

          {role === 'provider' ? (
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                <Briefcase size={13} /> Provider Partner Registration
              </span>
              <h1 className="text-2xl font-black text-gray-900">Offer Services & Rentals</h1>
              <p className="text-gray-500 text-xs mt-1">Start receiving client bookings and gear rental orders in Cebu</p>
            </div>
          ) : (
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 mb-2">
                <User size={13} /> Customer Account
              </span>
              <h1 className="text-2xl font-black text-brand-700">Create your account</h1>
              <p className="text-gray-500 text-xs mt-1">Join Cebu's verified local service and rental community</p>
            </div>
          )}
        </div>

        <div className="card shadow-modal border border-gray-100">
          {/* Role selector (hidden on verification step) */}
          {step < 3 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleRoleChange('customer')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  role === 'customer'
                    ? 'border-brand-500 bg-brand-50/80 text-brand-800 shadow-sm ring-1 ring-brand-400'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span className="text-base">🛒</span> Customer
                </div>
                <div className="text-xs text-gray-500 mt-0.5">I want to book or rent</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('provider')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  role === 'provider'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-400'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-1.5 text-emerald-800">
                  <span className="text-base">💼</span> Provider Partner
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">I want to offer services/rentals</div>
              </button>
            </div>
          )}

          {/* Step progress */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  i < step
                    ? (role === 'provider' ? 'bg-emerald-600 text-white' : 'bg-brand-600 text-white')
                    : i === step
                    ? (role === 'provider' ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-brand-600 text-white ring-4 ring-brand-100')
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[11px] font-medium hidden sm:block ${
                  i === step ? (role === 'provider' ? 'text-emerald-700 font-bold' : 'text-brand-600 font-bold') : 'text-gray-400'
                }`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px ${
                    i < step ? (role === 'provider' ? 'bg-emerald-400' : 'bg-brand-400') : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP 0: Account / Business Info ─────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                {/* Provider-Specific Banner & Fields */}
                {role === 'provider' ? (
                  <>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                      <Sparkles size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Provider Profile Setup:</span> Tell us about your service or rental business so Cebu customers can discover you.
                      </div>
                    </div>

                    {/* Business / Trade Name */}
                    <div className="form-group">
                      <label className="label flex items-center justify-between">
                        <span>Business or Trade Name</span>
                        <span className="text-[10px] text-gray-400 font-normal">Personal name if freelancer</span>
                      </label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          name="businessName"
                          required
                          value={providerDetails.businessName}
                          onChange={e => handleProviderDetailChange('businessName', e.target.value)}
                          placeholder="e.g. Cebu Pro Cleaning Services or Juan's AC Repair"
                          className="input pl-9 border-emerald-200 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Provider Offering Type (Service, Rental, or Both) */}
                    <div className="form-group">
                      <label className="label">What do you offer to customers?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'service', label: '🛠️ Services', desc: 'Repairs, Cleaning, Tutors' },
                          { id: 'rental',  label: '📦 Rentals',  desc: 'Gear, Venues, Vehicles' },
                          { id: 'both',    label: '⚡ Both',     desc: 'Services & Equipment' },
                        ].map(type => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => handleProviderDetailChange('providerType', type.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              providerDetails.providerType === type.id
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-xs">{type.label}</div>
                            <div className="text-[10px] text-gray-400 font-normal mt-0.5 leading-tight">{type.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Primary Industry / Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-group">
                        <label className="label">Primary Category</label>
                        <select
                          value={providerDetails.category}
                          onChange={e => handleProviderDetailChange('category', e.target.value)}
                          className="input"
                        >
                          {PROVIDER_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="label">Experience / In Business</label>
                        <select
                          value={providerDetails.yearsExp}
                          onChange={e => handleProviderDetailChange('yearsExp', e.target.value)}
                          className="input"
                        >
                          <option value="0">Just starting out (Under 1 year)</option>
                          <option value="1">1 – 2 years</option>
                          <option value="3">3 – 5 years</option>
                          <option value="5">5+ years established</option>
                        </select>
                      </div>
                    </div>

                    {/* Owner / Contact Name */}
                    <div className="form-group">
                      <label className="label">Owner / Contact Representative Full Name</label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          name="fullName"
                          required
                          value={form.fullName}
                          onChange={handleChange}
                          placeholder="e.g. Juan dela Cruz"
                          className="input pl-9"
                        />
                      </div>
                    </div>

                    {/* Email & Phone side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-group">
                        <label className="label">Business / Contact Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            name="email"
                            type="email"
                            required
                            value={form.email}
                            onChange={handleChange}
                            placeholder="business@email.com"
                            className="input pl-9"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="label">GCash / Contact Mobile</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            name="phone"
                            type="tel"
                            required
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="09xxxxxxxxx"
                            className="input pl-9"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ── Customer Account Fields ── */
                  <>
                    <div className="form-group">
                      <label className="label">Full Name</label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          name="fullName"
                          required
                          value={form.fullName}
                          onChange={handleChange}
                          placeholder="Juan dela Cruz"
                          className="input pl-9"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="label">Email address</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          name="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@email.com"
                          className="input pl-9"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="label">Contact Mobile Number</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          name="phone"
                          type="tel"
                          required
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="09xxxxxxxxx"
                          className="input pl-9"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Prominent Action Buttons on Step 0 */}
                <div className="flex gap-3 mt-2">
                  <Link
                    to="/"
                    className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-gray-100"
                  >
                    <ArrowLeft size={16} /> Back to Home
                  </Link>
                  <button
                    type="button"
                    onClick={nextStep}
                    className={`btn-primary btn-lg flex-1 flex items-center justify-center gap-2 font-bold shadow-sm ${
                      role === 'provider' ? '!bg-emerald-600 hover:!bg-emerald-700 text-white' : ''
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 1: Location & Coverage ───────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                {role === 'provider' ? (
                  <>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                      <MapPin size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Provider Base & Service Areas:</span> Pin your primary shop/workshop address, and indicate the Cebu cities where you can deliver services or drop off rentals.
                      </div>
                    </div>

                    <LocationPicker
                      value={location}
                      onChange={setLocation}
                      label="Shop / Base Workshop Location in Cebu"
                    />

                    {/* Service Coverage Area Checkboxes */}
                    <div className="form-group mt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="label mb-0">Cebu Service Coverage Areas</label>
                        <button
                          type="button"
                          onClick={selectAllCoverage}
                          className="text-xs text-emerald-700 font-bold hover:underline"
                        >
                          {providerDetails.serviceCoverage.length === CEBU_COVERAGE_AREAS.length ? 'Clear All' : 'Select All Cebu'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {CEBU_COVERAGE_AREAS.map(area => {
                          const isSelected = providerDetails.serviceCoverage.includes(area)
                          return (
                            <button
                              key={area}
                              type="button"
                              onClick={() => toggleCoverageArea(area)}
                              className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <span>{area}</span>
                              {isSelected && <span className="text-emerald-600 font-bold">✓</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                      <MapPin size={15} className="text-brand-600 flex-shrink-0" />
                      <p className="text-xs text-brand-700">
                        Your location helps local providers find you and lets you discover nearby listings in Cebu.
                      </p>
                    </div>

                    <LocationPicker
                      value={location}
                      onChange={setLocation}
                      label="Search your address in Cebu"
                    />
                  </>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="btn-secondary flex-1 py-3 flex items-center justify-center gap-1.5 font-semibold text-sm hover:bg-gray-100"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className={`btn-primary btn-lg flex-1 flex items-center justify-center gap-2 font-bold shadow-sm ${
                      role === 'provider' ? '!bg-emerald-600 hover:!bg-emerald-700 text-white' : ''
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Password & Agreements ──────────────────────────── */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                {/* Password */}
                <div className="form-group">
                  <label className="label">Create Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      name="password"
                      type={showPw ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="input pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label className="label">Confirm Password</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input"
                  />
                </div>

                {/* Terms Agreement Checkbox */}
                {role === 'provider' ? (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                        className="mt-1 accent-emerald-600 w-4 h-4 rounded"
                      />
                      <span className="text-xs text-emerald-950 leading-relaxed">
                        I agree to the <strong>ServiceQ Provider Partnership Terms</strong>: 10% platform commission on completed bookings, ID verification requirement, and commitment to punctual, honest service standards.
                      </span>
                    </label>
                  </div>
                ) : (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      className="mt-0.5 accent-brand-600"
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <button type="button" className="text-brand-600 hover:underline font-semibold">Terms & Conditions</button>
                    </span>
                  </label>
                )}

                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1 py-3 flex items-center justify-center gap-1.5 font-semibold text-sm hover:bg-gray-100"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn-primary btn-lg flex-1 font-bold shadow-sm ${
                      role === 'provider' ? '!bg-emerald-600 hover:!bg-emerald-700 text-white' : ''
                    }`}
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Send Verification Code →'
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── STEP 3: Verify Email OTP ───────────────────────────────── */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="flex flex-col gap-5"
              >
                <div className="text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2.5 ${
                    role === 'provider' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600'
                  }`}>
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
                      className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-colors ${
                        role === 'provider' ? 'focus:border-emerald-500' : 'focus:border-brand-500'
                      } border-gray-200`}
                      maxLength={1}
                      inputMode="numeric"
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="btn-secondary flex-1 py-2.5 flex items-center justify-center gap-1.5 font-semibold text-xs"
                  >
                    <ArrowLeft size={14} /> Back to Edit Info
                  </button>
                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className={`btn-primary flex-1 py-2.5 font-bold shadow-sm ${
                      role === 'provider' ? '!bg-emerald-600 hover:!bg-emerald-700 text-white' : ''
                    }`}
                  >
                    {verifyLoading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Verify & Activate'
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                  <span className="text-gray-400">Didn't get the code?</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || resending}
                    className={`font-semibold ${
                      resendCooldown > 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : (role === 'provider' ? 'text-emerald-700 hover:underline' : 'text-brand-600 hover:underline')
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer Navigation */}
          {step < 3 && (
            <div className="text-center text-xs sm:text-sm text-gray-500 mt-5 pt-3 border-t border-gray-100 flex flex-col items-center gap-2">
              <p>
                Already have an account?{' '}
                <Link
                  to={role === 'provider' ? '/login?role=provider' : '/login'}
                  className={role === 'provider' ? 'text-emerald-700 font-bold hover:underline' : 'text-brand-600 font-bold hover:underline'}
                >
                  Sign in
                </Link>
              </p>
              <Link to="/" className="text-xs text-gray-400 hover:text-gray-700 inline-flex items-center gap-1">
                <ArrowLeft size={12} /> Return to ServiceQ Homepage
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

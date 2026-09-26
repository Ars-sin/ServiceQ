import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, Lock, Eye, EyeOff, MapPin, ChevronRight, ChevronLeft,
  ShieldCheck, ArrowLeft, Briefcase, Building2, Wrench, Package, Sparkles, Home, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import LocationPicker from '@/components/ui/LocationPicker'
import Modal from '@/components/ui/Modal'

const STEPS = ['Account Info', 'Location', 'Password', 'Verify Email']

const CEBU_COVERAGE_AREAS = [
  'Cebu City', 'Mandaue City', 'Lapu-Lapu City', 'Talisay City',
  'Consolacion', 'Liloan', 'Minglanilla', 'Cordova', 'Toledo City',
  'Danao City', 'Carcar City', 'Naga City', 'Compostela', 'Balamban',
  'Other Location in Cebu'
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

import GoogleSignInModal from '@/components/auth/GoogleSignInModal'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialRole  = searchParams.get('role') === 'provider' ? 'provider' : 'customer'
  const initialEmail = searchParams.get('email') || ''
  const initialName  = searchParams.get('name') || ''
  const fromGoogle   = searchParams.get('from') === 'google'

  const [step, setStep]                   = useState(0)
  const [role, setRole]                   = useState(initialRole)
  const [showPw, setShowPw]               = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [agreed, setAgreed]               = useState(false)
  const [loading, setLoading]             = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendCooldown, setCooldown]     = useState(0)
  const [resending, setResending]         = useState(false)
  const [isFreelancer, setIsFreelancer]   = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [otherCoverageText, setOtherCoverageText] = useState('')
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showUnderReviewModal, setShowUnderReviewModal] = useState(false)

  const [otp, setOtp]       = useState(['', '', '', '', '', ''])
  const inputRefs           = useRef([])

  // Basic form with separated name fields
  const [form, setForm] = useState({
    firstName: initialName.split(' ')[0] || '',
    lastName: initialName.split(' ').slice(1).join(' ') || '',
    middleInitial: '',
    email: initialEmail,
    phone: '',
    password: '',
    confirmPassword: '',
  })

  // Provider-specific details - clean placeholders / unselected by default
  const [providerDetails, setProviderDetails] = useState({
    businessName: '',
    providerType: '', // 'service' | 'rental' | 'both' (unselected by default)
    category: '',     // unselected placeholder by default
    yearsExp: '',     // unselected placeholder by default
    serviceCoverage: [], // unselected by default
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

  const getFullName = () => {
    const parts = [form.firstName.trim()]
    if (form.middleInitial.trim()) parts.push(`${form.middleInitial.trim().replace(/\./g, '')}.`)
    if (form.lastName.trim()) parts.push(form.lastName.trim())
    return parts.join(' ')
  }

  const handleRoleChange = (newRole) => {
    if (newRole === role) return
    setRole(newRole)
    setStep(0)
    setForm(prev => ({
      firstName: fromGoogle ? prev.firstName : '',
      lastName: fromGoogle ? prev.lastName : '',
      middleInitial: fromGoogle ? prev.middleInitial : '',
      email: fromGoogle ? (prev.email || initialEmail) : '',
      phone: '',
      password: '',
      confirmPassword: '',
    }))
    setIsFreelancer(false)
    setCustomCategory('')
    setOtherCoverageText('')
    setProviderDetails({
      businessName: '',
      providerType: '',
      category: '',
      yearsExp: '',
      serviceCoverage: [],
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
    setShowConfirmPw(false)
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

  // ── Live validation flags for disabled button states ────────────────────
  const hasMinLength = form.password.length >= 6
  const hasUpperLower = /[a-z]/.test(form.password) && /[A-Z]/.test(form.password)
  const hasNumber = /\d/.test(form.password)
  const isPasswordValid = hasMinLength && hasUpperLower && hasNumber
  const passwordsMatch = Boolean(form.password && form.confirmPassword && form.password === form.confirmPassword)

  const isStep0Valid = role === 'provider'
    ? Boolean(
        (isFreelancer || providerDetails.businessName.trim()) &&
        providerDetails.providerType &&
        providerDetails.category &&
        (providerDetails.category !== 'Other Local Service / Rental' || customCategory.trim()) &&
        providerDetails.yearsExp !== '' &&
        form.firstName.trim().length >= 2 &&
        form.lastName.trim().length >= 2 &&
        /^\S+@\S+\.\S+$/.test(form.email.trim()) &&
        form.phone.replace(/\D/g, '').length >= 10
      )
    : Boolean(
        form.firstName.trim().length >= 2 &&
        form.lastName.trim().length >= 2 &&
        /^\S+@\S+\.\S+$/.test(form.email.trim()) &&
        form.phone.replace(/\D/g, '').length >= 10
      )

  const isStep1Valid = role === 'provider'
    ? Boolean(
        location.barangay?.trim() &&
        location.city?.trim() &&
        providerDetails.serviceCoverage.length > 0 &&
        (!providerDetails.serviceCoverage.includes('Other Location in Cebu') || otherCoverageText.trim())
      )
    : Boolean(location.barangay?.trim() && location.city?.trim())

  const isStep2Valid = isPasswordValid && passwordsMatch && agreed
  const isStep3Valid = otp.join('').trim().length === 6

  // ── Step validation (strict feedback on the exact step) ───────────────
  const validateStep0 = () => {
    if (role === 'provider' && !isFreelancer && !providerDetails.businessName.trim()) {
      toast.error('Please enter your business or trade name (or check freelancer if individual)')
      return false
    }
    if (role === 'provider' && !providerDetails.providerType) {
      toast.error('Please select what you offer (Services, Rentals, or Both)')
      return false
    }
    if (role === 'provider' && !providerDetails.category) {
      toast.error('Please select your primary category')
      return false
    }
    if (role === 'provider' && providerDetails.category === 'Other Local Service / Rental' && !customCategory.trim()) {
      toast.error('Please specify your other service or rental type')
      return false
    }
    if (role === 'provider' && providerDetails.yearsExp === '') {
      toast.error('Please select your years of experience')
      return false
    }
    if (!form.firstName.trim()) {
      toast.error('Please enter your first name')
      return false
    }
    if (form.firstName.trim().length < 2) {
      toast.error('First name must be at least 2 characters')
      return false
    }
    if (!form.lastName.trim()) {
      toast.error('Please enter your last name')
      return false
    }
    if (form.lastName.trim().length < 2) {
      toast.error('Last name must be at least 2 characters')
      return false
    }
    const cleanEmail = form.email.trim()
    if (!cleanEmail) {
      toast.error('Please enter your email address')
      return false
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error('Please enter a valid email address')
      return false
    }
    const digitsOnly = form.phone.replace(/\D/g, '')
    if (!digitsOnly) {
      toast.error('Please enter your contact number')
      return false
    }
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      toast.error('Contact number must be 10 to 11 digits (e.g. 09123456789)')
      return false
    }
    return true
  }

  const validateStep1 = () => {
    if (!location.barangay?.trim() || !location.city?.trim()) {
      toast.error('Please enter your Barangay and City/Municipality')
      return false
    }
    // R4: Postal code required
    if (!location.postalCode?.trim()) {
      toast.error('Please enter your Postal Code')
      return false
    }
    if (role === 'provider') {
      if (providerDetails.serviceCoverage.length === 0) {
        toast.error('Please select at least one Cebu service coverage area')
        return false
      }
      if (providerDetails.serviceCoverage.includes('Other Location in Cebu') && !otherCoverageText.trim()) {
        toast.error('Please specify your other coverage location in Cebu')
        return false
      }
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

    const resolvedFullName = getFullName()
    const resolvedBusinessName = role === 'provider'
      ? (isFreelancer ? resolvedFullName : (providerDetails.businessName.trim() || resolvedFullName))
      : null
    const resolvedCategory = role === 'provider'
      ? (providerDetails.category === 'Other Local Service / Rental' && customCategory.trim()
          ? `Other: ${customCategory.trim()}`
          : providerDetails.category)
      : null
    const coverageList = providerDetails.serviceCoverage.map(c =>
      c === 'Other Location in Cebu' && otherCoverageText.trim() ? otherCoverageText.trim() : c
    )

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: resolvedFullName,
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            middle_initial: form.middleInitial.trim(),
            phone: form.phone.replace(/\D/g, ''),
            role,
            is_freelancer: isFreelancer,
            business_name: resolvedBusinessName,
            provider_type: role === 'provider' ? [providerDetails.providerType] : null,
            category: resolvedCategory,
            years_experience: providerDetails.yearsExp,
            service_area: role === 'provider' ? coverageList.join(', ') : null,
          }
        },
      })

      if (error) throw error

      // Cache provider registration details so Provider Profile immediately reflects them (Slide 39)
      if (role === 'provider') {
        const cachedProviderData = {
          fullName: resolvedFullName,
          email: form.email.trim(),
          phone: form.phone.replace(/\D/g, ''),
          businessName: resolvedBusinessName,
          description: '',
          category: resolvedCategory,
          providerType: resolvedCategory || (providerDetails.providerType === 'rental' ? 'Rentals' : 'Services'),
          yearsExp: providerDetails.yearsExp || 'Less than a year',
          serviceArea: coverageList.join(', ') || (location.city ? `${location.city}, Metro Cebu` : 'Cebu City, Metro Cebu'),
          address: location.address,
          barangay: location.barangay,
          city: location.city || 'Cebu City',
          province: location.province || 'Cebu',
          postalCode: location.postalCode || '6000',
          idType: '',
          idNumber: '',
          payoutMethod: '',
          payoutAccountName: '',
          payoutAccountNumber: '',
          status: 'under_verification'
        }
        if (data?.user?.id) {
          localStorage.setItem(`serviceq_provider_profile_${data.user.id}`, JSON.stringify(cachedProviderData))
        }
        localStorage.setItem(`serviceq_provider_profile_email_${form.email.trim().toLowerCase()}`, JSON.stringify(cachedProviderData))
        localStorage.setItem('serviceq_latest_provider_registered', JSON.stringify(cachedProviderData))
      }

      // Save initial profile details
      if (data?.user?.id) {
        await supabase
          .from('profiles')
          .upsert({
            id:          data.user.id,
            email:       form.email.trim(),
            full_name:   resolvedFullName,
            phone:       form.phone.replace(/\D/g, ''),
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
              business_name: resolvedBusinessName,
              business_description: `Category: ${resolvedCategory} | ${providerDetails.yearsExp} experience`,
              provider_type: [providerDetails.providerType || 'service'],
              years_experience: providerDetails.yearsExp === 'Less than a year' ? 0 : (parseInt(providerDetails.yearsExp) || 1),
              service_area: coverageList.join(', ') || location.city || 'Cebu',
              kyc_status: 'under_verification',
              provider_status: 'active',
            }, { onConflict: 'user_id' })
          } catch (provErr) {
            console.warn('Initial provider table entry note:', provErr)
          }
        }
      }

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

      let verifyResult = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: 'signup',
      })

      if (verifyResult.error) {
        verifyResult = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token,
          type: 'email',
        })
      }

      if (verifyResult.error) throw verifyResult.error

      toast.success('Email verified successfully! Welcome to ServiceQ 🎉')

      if (role === 'provider') {
        setShowUnderReviewModal(true)
      } else {
        navigate('/customer/explore', { replace: true })
      }

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
      {/* ── Fixed/Floating Top Home Button ── */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          to="/"
          title="Back to Home"
          aria-label="Back to Home"
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-brand-600 hover:border-brand-300 shadow-sm transition-all hover:scale-105 active:scale-95 group"
        >
          <Home size={18} className="text-gray-600 group-hover:text-brand-600 transition-colors" />
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
              <h1 className="text-2xl font-black text-brand-700">Create your account</h1>
            </div>
          )}
        </div>

        <div className="card shadow-modal border border-gray-100">
          {/* Google Registration Detected Banner */}
          {fromGoogle && (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-brand-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-brand-900">Google Registration Detected</p>
                <p className="text-xs text-brand-700 mt-0.5 leading-relaxed">
                  Registering with <span className="font-semibold underline">{form.email || initialEmail}</span>. Choose whether you want to join as a <span className="font-bold">Customer</span> or <span className="font-bold">Provider Partner</span> below:
                </p>
              </div>
            </div>
          )}

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

                    {/* Individual Freelancer Checkbox */}
                    <label className="flex items-center gap-2.5 p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={isFreelancer}
                        onChange={e => setIsFreelancer(e.target.checked)}
                        className="accent-emerald-600 w-4 h-4 rounded"
                      />
                      <span className="text-xs font-semibold text-emerald-900">
                        I am an individual freelancer / sole proprietor
                      </span>
                    </label>

                    {/* Business / Trade Name or Freelancer Indicator */}
                    {!isFreelancer ? (
                      <div className="form-group">
                        <label className="label flex items-center justify-between">
                          <span>
                            Business or Trade Name <span className="text-red-500 font-bold">*</span>
                          </span>
                        </label>
                        <input
                          name="businessName"
                          required={!isFreelancer}
                          value={providerDetails.businessName}
                          onChange={e => handleProviderDetailChange('businessName', e.target.value)}
                          placeholder="e.g. Cebu Pro Cleaning Services or Queen City Rentals"
                          className="input border-emerald-200 focus:border-emerald-500"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-800 bg-emerald-50/60 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                        <span>👤</span>
                        <span>Operating under personal name: <strong>{getFullName() || 'Your Name'}</strong></span>
                      </div>
                    )}

                    {/* Provider Offering Type (Service, Rental, or Both) */}
                    <div className="form-group">
                      <label className="label">
                        What do you offer to customers? <span className="text-red-500 font-bold">*</span>
                      </label>
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

                    {/* Primary Industry / Category & Experience */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-group">
                        <label className="label">
                          Primary Category <span className="text-red-500 font-bold">*</span>
                        </label>
                        <select
                          value={providerDetails.category}
                          onChange={e => handleProviderDetailChange('category', e.target.value)}
                          className={`input ${!providerDetails.category ? 'text-gray-400' : 'text-gray-800'}`}
                        >
                          <option value="">Select a category</option>
                          {PROVIDER_CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="text-gray-800">{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="label">
                          Experience / In Business <span className="text-red-500 font-bold">*</span>
                        </label>
                        <select
                          value={providerDetails.yearsExp}
                          onChange={e => handleProviderDetailChange('yearsExp', e.target.value)}
                          className={`input ${providerDetails.yearsExp === '' ? 'text-gray-400' : 'text-gray-800'}`}
                        >
                          <option value="">Years of experience</option>
                          <option value="Less than a year" className="text-gray-800">Less than a year</option>
                          <option value="1 – 2 years" className="text-gray-800">1 – 2 years</option>
                          <option value="3 – 5 years" className="text-gray-800">3 – 5 years</option>
                          <option value="5+ years" className="text-gray-800">5+ years</option>
                        </select>
                      </div>
                    </div>

                    {/* Conditional Custom Category Input */}
                    {providerDetails.category === 'Other Local Service / Rental' && (
                      <div className="form-group">
                        <label className="label">
                          Specify Service / Rental Type <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          value={customCategory}
                          onChange={e => setCustomCategory(e.target.value)}
                          placeholder="e.g. Pet Grooming, Solar Installation, Sound System Setup..."
                          className="input border-emerald-200 focus:border-emerald-500"
                          required
                        />
                      </div>
                    )}

                    {/* Owner / Contact Representative Name (Balanced 2-Column) */}
                    <div>
                      <label className="label mb-1.5">
                        Owner / Representative Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <input
                            name="firstName"
                            required
                            value={form.firstName}
                            onChange={handleChange}
                            placeholder="First Name"
                            className="input"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            name="lastName"
                            required
                            value={form.lastName}
                            onChange={handleChange}
                            placeholder="Last Name"
                            className="input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email & Contact Number side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-group">
                        <label className="label">
                          Business / Contact Email <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          name="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="business@email.com"
                          className="input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="label">
                          Contact Number <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          name="phone"
                          type="tel"
                          required
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="09xxxxxxxxx"
                          className="input"
                        />
                      </div>
                    </div>

                    {/* P2: Reminder for Lacking/Missing Fields */}
                    {(() => {
                      const lacking = []
                      if (!isFreelancer && !providerDetails.businessName.trim()) lacking.push('Business Name')
                      if (!providerDetails.providerType) lacking.push('Offering Type')
                      if (!providerDetails.category) lacking.push('Category')
                      if (providerDetails.category === 'Other Local Service / Rental' && !customCategory.trim()) lacking.push('Specific Category')
                      if (!providerDetails.yearsExp) lacking.push('Experience')
                      if (!form.firstName.trim()) lacking.push('First Name')
                      if (!form.lastName.trim()) lacking.push('Last Name')
                      if (!form.email.trim()) lacking.push('Email')
                      if (!form.phone.trim()) lacking.push('Contact Number')

                      if (lacking.length > 0) {
                        return (
                          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mt-1">
                            <span className="font-bold flex items-center gap-1.5 text-amber-800">
                              <span>⚠️</span> Reminder — Please fill in required fields:
                            </span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {lacking.map(f => (
                                <span key={f} className="px-2 py-0.5 bg-amber-100/70 border border-amber-200 rounded-md font-medium text-amber-900 text-[11px]">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </>
                ) : (
                  /* ── Customer Account Fields ── */
                  <>
                    <div className="form-group">
                      <label className="label mb-1.5">
                        Full Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <input
                            name="firstName"
                            required
                            value={form.firstName}
                            onChange={handleChange}
                            placeholder="First Name"
                            className="input"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            name="lastName"
                            required
                            value={form.lastName}
                            onChange={handleChange}
                            placeholder="Last Name"
                            className="input"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="label">
                        Email address <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@email.com"
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">
                        Contact Number <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="09xxxxxxxxx"
                        className="input"
                      />
                    </div>
                  </>
                )}

                <button
                  type="button"
                  disabled={!isStep0Valid}
                  onClick={nextStep}
                  className={`btn-primary btn-lg w-full flex items-center justify-center gap-2 font-bold shadow-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    role === 'provider' ? '!bg-emerald-600 hover:!bg-emerald-700 text-white' : ''
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>

                {/* Social Sign-Up Options (Google & Facebook) */}
                <div className="flex items-center gap-3 my-2 pt-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">or sign up with</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(true)}
                    className="btn-secondary py-2.5 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Sign up with Google"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => toast('Facebook sign-up coming soon!')}
                    className="btn-secondary py-2.5 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Sign up with Facebook"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
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

                      {/* Conditional Other Coverage Input */}
                      {providerDetails.serviceCoverage.includes('Other Location in Cebu') && (
                        <div className="form-group mt-2">
                          <label className="label">Specify Other Cebu Area / Municipality</label>
                          <input
                            value={otherCoverageText}
                            onChange={e => setOtherCoverageText(e.target.value)}
                            placeholder="e.g. Moalboal, Bantayan, Bogo, Oslob..."
                            className="input border-emerald-200 focus:border-emerald-500"
                            required
                          />
                        </div>
                      )}

                      <div className="text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-2 font-medium mt-2">
                        📍 <strong>Notice:</strong> ServiceQ currently operates exclusively within Cebu Province.
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
                    disabled={!isStep1Valid}
                    onClick={nextStep}
                    className={`btn-primary btn-lg flex-1 flex items-center justify-center gap-2 font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
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
                {/* Create Password */}
                <div className="form-group">
                  <label className="label">
                    Create Password <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPw ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password requirement indicators (Slide 8 & 24) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mt-2 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasMinLength ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                        {hasMinLength ? '✓' : '•'}
                      </span>
                      <span>At least 6 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUpperLower ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasUpperLower ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                        {hasUpperLower ? '✓' : '•'}
                      </span>
                      <span>Uppercase & lowercase</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                        {hasNumber ? '✓' : '•'}
                      </span>
                      <span>At least 1 number</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password (with Eye icon) */}
                <div className="form-group">
                  <label className="label">
                    Confirm Password <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPw ? 'text' : 'password'}
                      required
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Passwords match indicator */}
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${passwordsMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      {passwordsMatch ? '✓' : '•'}
                    </span>
                    <span className={passwordsMatch ? 'text-emerald-600 font-semibold' : 'text-gray-400'}>
                      {passwordsMatch ? 'Passwords match' : 'Passwords must match'}
                    </span>
                  </div>
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
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-emerald-700 font-bold underline hover:text-emerald-800"
                        >
                          ServiceQ Provider Partnership Terms
                        </button>
                        : 10% platform commission on completed bookings, ID verification requirement, and commitment to punctual, honest service standards.
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
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-brand-600 hover:underline font-semibold"
                      >
                        Terms & Conditions
                      </button>
                    </span>
                  </label>
                )}

                {/* Email Verification Notice (Slide 8 & 24) */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
                  <Mail size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Email Verification Notice:</strong> The 6-digit confirmation code will be sent to your registered email address (<span className="font-semibold">{form.email || 'your email'}</span>), not your phone number.
                  </p>
                </div>

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
                    disabled={loading || !isStep2Valid}
                    className={`btn-primary btn-lg flex-1 flex items-center justify-center gap-1.5 font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      role === 'provider' ? '!bg-emerald-600 hover:!bg-emerald-700 text-white' : ''
                    }`}
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ChevronRight size={16} />
                      </>
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
                    className="btn-secondary flex-1 py-2.5 flex items-center justify-center gap-1.5 font-semibold text-xs hover:bg-gray-100"
                  >
                    <ArrowLeft size={14} /> Edit Account Info
                  </button>
                  <button
                    type="submit"
                    disabled={verifyLoading || otp.join('').trim().length < 6}
                    className={`btn-primary flex-1 py-2.5 font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      role === 'provider' ? '!bg-emerald-600 hover:!bg-emerald-700 text-white' : ''
                    }`}
                  >
                    {verifyLoading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Verify & Activate Account'
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
            <div className="text-center text-xs sm:text-sm text-gray-500 mt-5 pt-3 border-t border-gray-100">
              <p>
                Already have an account?{' '}
                <Link
                  to={role === 'provider' ? '/login?role=provider' : '/login'}
                  className={role === 'provider' ? 'text-emerald-700 font-bold hover:underline' : 'text-brand-600 font-bold hover:underline'}
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Terms & Conditions Modal ── */}
      <Modal
        open={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title={role === 'provider' ? 'ServiceQ Provider Partnership Terms' : 'ServiceQ Terms of Service'}
        size="lg"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-xs text-gray-600 leading-relaxed">
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">1. Scope of Service & Platform Role</h4>
            <p>ServiceQ operates as a hyperlocal service marketplace connecting verified customers and independent service providers and equipment renters across Cebu Province. ServiceQ is not an employer or principal contractor.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">2. Provider Verification (KYC)</h4>
            <p>To uphold safety and credibility, all provider partners must submit valid government identification before publishing listings. ServiceQ reserves the right to suspend accounts with unverified or fraudulent documentation.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">3. Platform Fees & Commission</h4>
            <p>Provider accounts agree to a standard 10% platform commission on completed service and rental transactions processed through the ServiceQ platform.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">4. Scheduling & Cancellation Standards</h4>
            <p>Bookings are scheduled based on provider availability. Providers must commit to punctual arrival. Cancellations with less than 4 hours notice may incur account penalties.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">5. Data Privacy</h4>
            <p>User contact information and location data are stored securely and used solely for fulfilling bookings and platform notifications in accordance with Philippine Data Privacy laws.</p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setAgreed(true)
                setShowTermsModal(false)
              }}
              className="btn-primary w-full py-2.5 font-bold"
            >
              I Understand & Agree
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Provider Under Review Modal ── */}
      <Modal
        open={showUnderReviewModal}
        onClose={() => {
          setShowUnderReviewModal(false)
          navigate('/provider/dashboard', { replace: true })
        }}
        title="Application Submitted for Review 🎉"
        size="md"
      >
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Welcome to the ServiceQ Provider Network!</h3>
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            Your email has been verified. To maintain trust and high service quality for Cebu customers, provider partner profiles undergo a brief onboarding review.
          </p>
          <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-left text-xs text-emerald-900 mb-5 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" /> Next Steps:
            </p>
            <p>• You can access your Provider Dashboard right away.</p>
            <p>• Complete your ID verification (KYC) in your profile to publish active listings.</p>
            <p>• Our team reviews accounts within 24–48 hours.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowUnderReviewModal(false)
              navigate('/provider/dashboard', { replace: true })
            }}
            className="btn-primary w-full py-3 !bg-emerald-600 hover:!bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
          >
            Go to Provider Dashboard →
          </button>
        </div>
      </Modal>

      {/* ── Google Sign-In / Sign-Up Modal ── */}
      <GoogleSignInModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        loginRole={role}
        onSuccessLogin={() => navigate(role === 'provider' ? '/provider/dashboard' : '/customer/explore')}
        onProceedRegister={(email) => {
          setShowGoogleModal(false)
          setForm(prev => ({ ...prev, email }))
        }}
      />
    </div>
  )
}

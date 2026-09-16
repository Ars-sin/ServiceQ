import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, Lock, Eye, EyeOff, MapPin, ChevronRight, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import LocationPicker from '@/components/ui/LocationPicker'

const STEPS = ['Account Info', 'Your Location', 'Set Password']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(0)
  const [role, setRole]     = useState('customer')
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

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

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    if (form.password.length < 6)               return toast.error('Password must be at least 6 characters')
    if (!agreed)                                 return toast.error('Please accept the Terms & Conditions')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
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

      // Save full profile including location
      if (data?.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id:          data.user.id,
            email:       form.email,
            full_name:   form.fullName,
            phone:       form.phone,
            role:        role || 'customer',
            address:     location.address,
            barangay:    location.barangay,
            city:        location.city,
            province:    location.province,
            postal_code: location.postalCode,
          }, { onConflict: 'id' })

        if (profileError) console.error('Profile save error:', profileError)
        else              console.log('Profile with location saved!')
      }

      // Store in sessionStorage so Provider Onboarding has access to auto-fill immediately
      try {
        sessionStorage.setItem('serviceq_reg_data', JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          address: location.address,
          barangay: location.barangay,
          city: location.city,
          province: location.province,
          postalCode: location.postalCode,
        }))
      } catch {}

      if (data?.user && !data?.session) {
        toast.success('✅ Account created! Check your email to confirm your account.')
        return
      }

      toast.success('Account created! Welcome to ServiceQ 🎉')
      navigate(role === 'provider' ? '/provider/onboarding' : '/customer/explore')

    } catch (err) {
      console.error('Registration error:', err)
      toast.error(err.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
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
          <p className="text-gray-500 text-sm mt-1">Join the ServiceQ community</p>
        </div>

        <div className="card shadow-modal">
          {/* Role selector */}
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
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-brand-600' : 'text-gray-400'}`}>{s}</span>
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
                      : role === 'provider' ? 'Continue to Setup →' : 'Create Account'
                    }
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

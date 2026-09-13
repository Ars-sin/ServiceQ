import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('customer')
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  })

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    if (!agreed) return toast.error('Please accept the Terms & Conditions')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName, phone: form.phone, role } },
      })

      console.log('SignUp response:', { data, error })

      if (error) throw error

      // Directly insert or update profiles table so the user is immediately saved in the database
      if (data?.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: form.email,
            full_name: form.fullName,
            phone: form.phone,
            role: role || 'customer',
          }, { onConflict: 'id' })

        if (profileError) {
          console.error('Profile storage error:', profileError)
        } else {
          console.log('Profile saved successfully to database!')
        }
      }

      // Email confirmation ON — account created but needs email verification
      if (data?.user && !data?.session) {
        toast.success('✅ Account created! Please check your email to confirm your account.')
        return
      }

      // Email confirmation OFF — logged in immediately
      toast.success('Account created! Welcome to ServiceQ 🎉')
      navigate(role === 'provider' ? '/provider/onboarding' : '/customer/dashboard')

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
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="ServiceQ" className="h-20 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-bold text-brand-700">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the ServiceQ community</p>
        </div>

        <div className="card shadow-modal">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { id: 'customer', label: '🛒 I want to Book', sub: 'Customer' },
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            {/* Password */}
            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input name="password" type={showPw ? 'text' : 'password'} required
                  value={form.password} onChange={handleChange} placeholder="••••••••" className="input pl-9 pr-10" />
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

            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
              {loading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : role === 'provider' ? 'Continue to Provider Setup →' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

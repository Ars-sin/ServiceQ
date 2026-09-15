import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronRight, ChevronLeft, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { PROVIDER_TYPES, GOV_ID_TYPES, PAYMENT_METHODS, PH_REGIONS } from '@/lib/constants'
import Modal from '@/components/ui/Modal'
import LocationPicker from '@/components/ui/LocationPicker'
import { supabase } from '@/lib/supabase'

const STEPS = [
  'Basic Info', 'Contact & Address', 'Provider Details',
  'Identity Verification', 'Payout Info', 'Agreements',
]

export default function ProviderOnboarding() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [step, setStep]         = useState(0)
  const [done, setDone]         = useState(false)
  const [agreed, setAgreed]     = useState({ terms: false, agreement: false, fee: false })
  const [form, setForm]         = useState({
    // Step 0
    fullName: '', email: '', phone: '', dob: '', password: '', confirmPw: '',
    // Step 1 (kept for compat — filled from locationData)
    street: '', barangay: '', city: '', province: '', postalCode: '',
    // Step 2
    providerType: '', businessName: '', description: '', yearsExp: '',
    hoursFrom: '', hoursTo: '', serviceArea: '', facebook: '', instagram: '',
    // Step 3
    idType: '', idNumber: '',
    // Step 4
    payoutMethod: 'gcash', gcashNum: '', mayaNum: '', bankName: '', accountName: '', accountNum: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const [locationData, setLocationData] = useState({
    address: '', barangay: '', city: '', province: '', postalCode: '', lat: null, lng: null,
  })

  // Auto-fill from registration data (profile, auth user, or cached registration)
  useEffect(() => {
    let savedReg = null
    try {
      savedReg = JSON.parse(sessionStorage.getItem('serviceq_reg_data'))
    } catch {}

    const name  = profile?.full_name || user?.user_metadata?.full_name || savedReg?.fullName
    const email = profile?.email || user?.email || savedReg?.email
    const phone = profile?.phone || user?.user_metadata?.phone || savedReg?.phone

    if (name || email || phone) {
      setForm(f => ({
        ...f,
        fullName: name  || f.fullName,
        email:    email || f.email,
        phone:    phone || f.phone,
      }))
    }

    const addr = profile?.address || savedReg?.address
    const brgy = profile?.barangay || savedReg?.barangay
    const city = profile?.city || savedReg?.city
    const prov = profile?.province || savedReg?.province
    const zip  = profile?.postal_code || savedReg?.postalCode

    if (addr || brgy || city || prov || zip) {
      setLocationData(loc => ({
        ...loc,
        address:    addr || loc.address,
        barangay:   brgy || loc.barangay,
        city:       city || loc.city,
        province:   prov || loc.province,
        postalCode: zip  || loc.postalCode,
      }))
    }
  }, [profile, user])

  const next = () => { if (step < 5) setStep(s => s + 1); else handleSubmit() }
  const back = () => setStep(s => Math.max(0, s - 1))

  const handleSubmit = async () => {
    if (!agreed.terms || !agreed.agreement || !agreed.fee) return toast.error('Please accept all agreements')

    if (user?.id) {
      try {
        await supabase.from('profiles').update({
          full_name: form.fullName,
          phone: form.phone,
          role: 'provider',
          address: locationData.address || form.street,
          barangay: locationData.barangay || form.barangay,
          city: locationData.city || form.city,
          province: locationData.province || form.province,
          postal_code: locationData.postalCode || form.postalCode,
        }).eq('id', user.id)

        await supabase.from('providers').upsert({
          user_id: user.id,
          business_name: form.businessName || form.fullName,
          business_description: form.description,
          provider_type: form.providerType || 'individual',
          years_experience: parseInt(form.yearsExp) || 0,
          operating_hours_from: form.hoursFrom || '08:00',
          operating_hours_to: form.hoursTo || '17:00',
          service_area: form.serviceArea || locationData.city || 'Cebu',
          gov_id_type: form.idType || 'UMID',
          gov_id_number: form.idNumber || '',
          gcash_number: form.gcashNum || form.phone,
          maya_number: form.mayaNum || '',
          bank_name: form.bankName || '',
          bank_account_name: form.accountName || form.fullName,
          bank_account_number: form.accountNum || '',
        }, { onConflict: 'user_id' })
      } catch (err) {
        console.error('Provider save error:', err)
      }
    }

    setDone(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar stepper */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 gap-6">
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center gap-2"><img src="/logo.png" alt="ServiceQ" className="h-8 w-8 object-contain" /><span className="font-bold text-gray-900">ServiceQ</span></div>
          <div className="text-xs text-gray-400">Provider Setup</div>
        </div>
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all mt-0.5 ${
              i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-100 text-gray-400'
            }`}>{i < step ? <CheckCircle size={14} /> : i + 1}</div>
            <div>
              <div className={`text-sm font-medium ${i === step ? 'text-emerald-700' : i < step ? 'text-gray-700' : 'text-gray-400'}`}>{s}</div>
              <div className="text-xs text-gray-400">Step {i + 1}</div>
            </div>
          </div>
        ))}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col p-6 md:p-10 max-w-2xl">
        {/* Mobile step */}
        <div className="md:hidden mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">{step + 1}</div>
            <span className="font-semibold text-sm">{STEPS[step]}</span>
            <span className="text-xs text-gray-400 ml-auto">Step {step + 1} of {STEPS.length}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6 flex-1">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">{STEPS[step]}</h1>
              <p className="text-sm text-gray-500 mt-1">Step {step + 1} of {STEPS.length}</p>
            </div>

            <div className="card flex flex-col gap-4">
              {/* STEP 0: Basic Info */}
              {step === 0 && <>
                {(user || profile || form.fullName) && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 flex items-start gap-2.5">
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Registered info auto-filled!</span>
                      <p className="text-emerald-700 mt-0.5">Your name, email, and phone number were loaded from your registration. Please fill in the missing details below (Date of Birth & Profile Photo).</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group sm:col-span-2">
                    <label className="label">Full Name</label>
                    <input className="input" placeholder="Juan dela Cruz" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">
                      Email Address {user && <span className="text-xs text-emerald-600 font-normal">(registered account)</span>}
                    </label>
                    <input
                      type="email"
                      className={`input ${user ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                      readOnly={!!user}
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Phone Number</label>
                    <input className="input" placeholder="09xxxxxxxxx" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label flex items-center justify-between">
                      <span>Date of Birth</span>
                      <span className="text-xs text-amber-600 font-medium">Missing — please select</span>
                    </label>
                    <input type="date" className="input" value={form.dob} onChange={e => set('dob', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label flex items-center justify-between">
                      <span>Profile Photo</span>
                      <span className="text-xs text-amber-600 font-medium">Missing — please upload</span>
                    </label>
                    <label className="input flex items-center gap-2 cursor-pointer">
                      <Upload size={14} className="text-gray-400" />
                      <span className="text-gray-400 text-sm">Upload photo...</span>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>
                  {!user && (
                    <>
                      <div className="form-group">
                        <label className="label">Password</label>
                        <input type="password" className="input" value={form.password} onChange={e => set('password', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="label">Confirm Password</label>
                        <input type="password" className="input" value={form.confirmPw} onChange={e => set('confirmPw', e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
              </>}

              {/* STEP 1: Address — Google Maps Location Picker */}
              {step === 1 && <>
                <LocationPicker
                  value={locationData}
                  onChange={setLocationData}
                  label="Search your service address in Cebu"
                />
              </>}

              {/* STEP 2: Provider Type & Details */}
              {step === 2 && <>
                <div className="form-group">
                  <label className="label">Provider Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROVIDER_TYPES.map(pt => (
                      <label key={pt.id} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${form.providerType === pt.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="ptype" value={pt.id} checked={form.providerType === pt.id} onChange={() => set('providerType', pt.id)} className="hidden" />
                        <span className="text-sm font-medium">{pt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group sm:col-span-2">
                    <label className="label">Business Name</label>
                    <input className="input" value={form.businessName} onChange={e => set('businessName', e.target.value)} />
                  </div>
                  <div className="form-group sm:col-span-2">
                    <label className="label">Business Description</label>
                    <textarea rows={3} className="input resize-none" value={form.description} onChange={e => set('description', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Years of Experience</label>
                    <input type="number" min={0} className="input" value={form.yearsExp} onChange={e => set('yearsExp', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Service Area</label>
                    <input className="input" placeholder="e.g. Quezon City, Pasig" value={form.serviceArea} onChange={e => set('serviceArea', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Operating Hours From</label>
                    <input type="time" className="input" value={form.hoursFrom} onChange={e => set('hoursFrom', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Operating Hours To</label>
                    <input type="time" className="input" value={form.hoursTo} onChange={e => set('hoursTo', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Facebook (optional)</label>
                    <input className="input" placeholder="https://facebook.com/..." value={form.facebook} onChange={e => set('facebook', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Instagram (optional)</label>
                    <input className="input" placeholder="https://instagram.com/..." value={form.instagram} onChange={e => set('instagram', e.target.value)} />
                  </div>
                </div>
              </>}

              {/* STEP 3: KYC */}
              {step === 3 && <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="label">Government ID Type</label>
                    <select className="input" value={form.idType} onChange={e => set('idType', e.target.value)}>
                      <option value="">Select ID type...</option>
                      {GOV_ID_TYPES.map(id => <option key={id} value={id}>{id}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">ID Number</label>
                    <input className="input" value={form.idNumber} onChange={e => set('idNumber', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Upload ID Photo</label>
                  <label className="border-2 border-dashed border-gray-300 rounded-xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-400 transition-colors">
                    <Upload size={28} className="text-gray-300" />
                    <span className="text-sm text-gray-400">Click to upload your Government ID</span>
                    <span className="text-xs text-gray-300">JPG, PNG up to 5MB</span>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </div>
                <div className="form-group">
                  <label className="label">Selfie Verification</label>
                  <label className="border-2 border-dashed border-gray-300 rounded-xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-400 transition-colors">
                    <span className="text-3xl">🤳</span>
                    <span className="text-sm text-gray-400">Take or upload a selfie</span>
                    <span className="text-xs text-gray-300">Hold your ID next to your face</span>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </div>
              </>}

              {/* STEP 4: Payout */}
              {step === 4 && <>
                <div className="form-group">
                  <label className="label">Preferred Payout Method</label>
                  <div className="flex gap-3">
                    {[{ id: 'gcash', label: '💚 GCash' }, { id: 'maya', label: '💙 Maya' }, { id: 'bank', label: '🏦 Bank Transfer' }].map(m => (
                      <label key={m.id} className={`flex-1 p-3 text-center rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${form.payoutMethod === m.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="payout" value={m.id} checked={form.payoutMethod === m.id} onChange={() => set('payoutMethod', m.id)} className="hidden" />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>
                {form.payoutMethod === 'gcash' && (
                  <div className="form-group">
                    <label className="label">GCash Mobile Number</label>
                    <input className="input" placeholder="09xxxxxxxxx" value={form.gcashNum} onChange={e => set('gcashNum', e.target.value)} />
                  </div>
                )}
                {form.payoutMethod === 'maya' && (
                  <div className="form-group">
                    <label className="label">Maya Mobile Number</label>
                    <input className="input" placeholder="09xxxxxxxxx" value={form.mayaNum} onChange={e => set('mayaNum', e.target.value)} />
                  </div>
                )}
                {form.payoutMethod === 'bank' && <>
                  <div className="form-group">
                    <label className="label">Bank Name</label>
                    <input className="input" placeholder="e.g. BDO, BPI, Metrobank" value={form.bankName} onChange={e => set('bankName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Account Name</label>
                    <input className="input" value={form.accountName} onChange={e => set('accountName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Account Number</label>
                    <input className="input" value={form.accountNum} onChange={e => set('accountNum', e.target.value)} />
                  </div>
                </>}
              </>}

              {/* STEP 5: Agreements */}
              {step === 5 && <>
                <div className="bg-gray-50 rounded-xl p-4 h-40 overflow-y-auto text-xs text-gray-500 leading-relaxed mb-2">
                  <strong>ServiceQ Terms & Conditions</strong><br /><br />
                  By registering as a provider on ServiceQ, you agree to maintain accurate listing information, honor all confirmed bookings, provide services as described, and adhere to all platform policies. ServiceQ reserves the right to suspend or terminate accounts that violate these terms. A platform fee of 10% is deducted from each successful booking payout...
                </div>
                {[
                  { key: 'terms', label: 'I have read and agree to the Terms & Conditions' },
                  { key: 'agreement', label: 'I agree to the Provider Agreement and service obligations' },
                  { key: 'fee', label: 'I understand and consent to the 10% Platform Fee per booking' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={agreed[key]} onChange={e => setAgreed(a => ({ ...a, [key]: e.target.checked }))}
                      className="mt-0.5 accent-emerald-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </>}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        <div className="flex justify-between pt-6 mt-auto">
          <button onClick={back} disabled={step === 0} className="btn-ghost gap-2 disabled:opacity-30">
            <ChevronLeft size={16} /> Back
          </button>
          <button onClick={next} className="btn-primary gap-2" style={{ background: '#059669' }}>
            {step === 5 ? 'Submit Application' : 'Next'} <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <Modal open={done} onClose={() => {}} title="Application Submitted! 🎉" size="sm">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl">⏳</div>
          <div>
            <h3 className="font-bold text-gray-900">Under Verification</h3>
            <p className="text-sm text-gray-500 mt-1">Your application is being reviewed. We'll notify you via email within 1–3 business days.</p>
          </div>
          <button onClick={() => navigate('/provider/dashboard')} className="btn-primary w-full" style={{ background: '#059669' }}>
            Go to Dashboard
          </button>
        </div>
      </Modal>
    </div>
  )
}


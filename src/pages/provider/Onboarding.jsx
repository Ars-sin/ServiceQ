import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronRight, ChevronLeft, Upload, ArrowLeft, Image, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { PROVIDER_TYPES, GOV_ID_TYPES } from '@/lib/constants'
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
  
  // Image previews
  const [photoPreview, setPhotoPreview]       = useState(null)
  const [idFrontPreview, setIdFrontPreview]   = useState(null)
  const [idBackPreview, setIdBackPreview]     = useState(null)
  const [selfiePreview, setSelfiePreview]     = useState(null)

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

  // O4: Auto-fill from registration data (profile, auth user, or cached registration)
  useEffect(() => {
    let savedReg = {}
    try {
      const s1 = JSON.parse(localStorage.getItem('serviceq_latest_provider_registered') || '{}')
      const s2 = JSON.parse(sessionStorage.getItem('serviceq_reg_data') || '{}')
      const s3 = user?.id ? JSON.parse(localStorage.getItem(`serviceq_provider_profile_${user.id}`) || '{}') : {}
      const s4 = user?.email ? JSON.parse(localStorage.getItem(`serviceq_provider_profile_email_${user.email.toLowerCase()}`) || '{}') : {}
      const s5 = JSON.parse(localStorage.getItem('serviceq_auth_profile') || '{}')
      savedReg = { ...s5, ...s1, ...s2, ...s3, ...s4 }
    } catch {}

    let meta = {}
    try {
      if (profile?.avatar_url && profile.avatar_url.startsWith('{')) {
        meta = JSON.parse(profile.avatar_url)
      }
    } catch {}

    const name  = profile?.full_name || user?.user_metadata?.full_name || savedReg?.fullName || (savedReg?.firstName ? `${savedReg.firstName} ${savedReg.lastName || ''}`.trim() : '')
    const email = profile?.email || user?.email || savedReg?.email
    const phone = profile?.phone || user?.user_metadata?.phone || savedReg?.phone
    const bName = meta?.business_name || profile?.business_name || user?.user_metadata?.business_name || savedReg?.businessName || name
    const pType = meta?.provider_type || user?.user_metadata?.provider_type?.[0] || savedReg?.providerType || 'services'
    const normPType = pType === 'rental' || pType === 'rental_items' ? 'rental_items' : pType === 'rental_props' ? 'rental_props' : pType === 'both' ? 'both' : 'services'
    const desc = meta?.description || savedReg?.description || (savedReg?.category ? `Specializing in ${savedReg.category}` : '')
    const years = meta?.years_experience || user?.user_metadata?.years_experience || savedReg?.yearsExp || '1'
    const serviceArea = meta?.service_area || user?.user_metadata?.service_area || savedReg?.serviceArea || (savedReg?.city ? `${savedReg.city}, Metro Cebu` : 'Cebu City, Metro Cebu')

    setForm(f => ({
      ...f,
      fullName:     name  || f.fullName,
      email:        email || f.email,
      phone:        phone || f.phone,
      businessName: bName || f.businessName,
      providerType: normPType || f.providerType || 'services',
      description:  desc || f.description,
      yearsExp:     years ? String(years).replace(/\D/g, '') || '1' : f.yearsExp,
      serviceArea:  serviceArea || f.serviceArea,
      hoursFrom:    meta?.hours_from || f.hoursFrom || '08:00',
      hoursTo:      meta?.hours_to || f.hoursTo || '17:00',
      accountName:  f.accountName || name || bName,
      gcashNum:     f.gcashNum || phone,
      mayaNum:      f.mayaNum || phone,
    }))

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

    // Auto-preview existing avatar image if available
    if (!photoPreview) {
      if (profile?.avatar_url && !profile.avatar_url.startsWith('{')) {
        setPhotoPreview(profile.avatar_url)
      } else if (user?.user_metadata?.avatar_url) {
        setPhotoPreview(user.user_metadata.avatar_url)
      } else if (user?.user_metadata?.picture) {
        setPhotoPreview(user.user_metadata.picture)
      }
    }
  }, [profile, user])

  const next = () => { if (step < 5) setStep(s => s + 1); else handleSubmit() }
  const back = () => setStep(s => Math.max(0, s - 1))

  const handleSubmit = async () => {
    if (!agreed.terms || !agreed.agreement || !agreed.fee) return toast.error('Please accept all agreements')

    if (user?.id) {
      try {
        const payoutMethodEnum = ['gcash', 'maya', 'bdo', 'bpi', 'metrobank'].includes(form.payoutMethod?.toLowerCase())
          ? form.payoutMethod.toLowerCase()
          : 'gcash'
        const payoutAccountNum = form.payoutMethod === 'gcash' ? form.gcashNum : form.payoutMethod === 'maya' ? form.mayaNum : form.accountNum
        const payoutBank = form.payoutMethod === 'bank' ? form.bankName : null

        await supabase.from('profiles').update({
          full_name: form.fullName,
          phone: form.phone,
          role: 'provider',
          address: locationData.address || form.street,
          barangay: locationData.barangay || form.barangay,
          city: locationData.city || form.city,
          province: locationData.province || form.province,
          postal_code: locationData.postalCode || form.postalCode,
          avatar_url: JSON.stringify({
            status: 'under_verification',
            business_name: form.businessName || form.fullName,
            description: form.description,
            gov_id_type: form.idType || 'PhilSys (National ID)',
            gov_id_number: form.idNumber || '',
            years_experience: parseInt(form.yearsExp) || 0,
            hours_from: form.hoursFrom || '08:00',
            hours_to: form.hoursTo || '17:00',
            service_area: form.serviceArea || locationData.city || 'Cebu',
            payout_method: payoutMethodEnum,
            payout_account_name: form.accountName || form.fullName,
            payout_account_number: payoutAccountNum || form.phone,
            payout_bank_name: payoutBank,
            submitted_at: new Date().toISOString()
          })
        }).eq('id', user.id)

        // Save extended provider details into auth user_metadata for bulletproof backup
        await supabase.auth.updateUser({
          data: {
            business_name: form.businessName || form.fullName,
            business_description: form.description,
            provider_type: ['service'],
            years_experience: parseInt(form.yearsExp) || 0,
            operating_hours_from: form.hoursFrom || '08:00',
            operating_hours_to: form.hoursTo || '17:00',
            service_area: form.serviceArea || locationData.city || 'Cebu',
            gov_id_type: form.idType || 'PhilSys (National ID)',
            gov_id_number: form.idNumber || '',
            payout_method: payoutMethodEnum,
            payout_account_name: form.accountName || form.fullName,
            payout_account_number: payoutAccountNum || form.phone,
            payout_bank_name: payoutBank,
            status: 'under_verification',
          }
        })

        const { data: provResult, error: provErr } = await supabase.from('providers').upsert({
          user_id: user.id,
          business_name: form.businessName || form.fullName,
          business_description: form.description,
          provider_type: ['service'],
          years_experience: parseInt(form.yearsExp) || 0,
          operating_hours_from: form.hoursFrom || '08:00',
          operating_hours_to: form.hoursTo || '17:00',
          service_area: form.serviceArea || locationData.city || 'Cebu',
          gov_id_type: form.idType || 'PhilSys (National ID)',
          gov_id_number: form.idNumber || '',
          payout_method: payoutMethodEnum,
          payout_account_name: form.accountName || form.fullName,
          payout_account_number: payoutAccountNum || form.phone,
          payout_bank_name: payoutBank,
          facebook_url: form.facebook || '',
          instagram_url: form.instagram || '',
          status: 'under_verification',
        }, { onConflict: 'user_id' })

        if (provErr) {
          console.warn('Provider table upsert warning (check RLS):', provErr.message)
        } else {
          console.log('Provider application saved to database!')
        }

        // Cache locally for immediate synchronization
        try {
          localStorage.setItem(`provider_profile_${user.id}`, JSON.stringify({
            businessName: form.businessName || form.fullName,
            description: form.description,
            yearsExp: form.yearsExp || '1',
            hoursFrom: form.hoursFrom || '08:00',
            hoursTo: form.hoursTo || '17:00',
            serviceArea: form.serviceArea || locationData.city || 'Cebu',
            idType: form.idType || 'PhilSys (National ID)',
            idNumber: form.idNumber || '',
            payoutMethod: payoutMethodEnum,
            payoutAccountName: form.accountName || form.fullName,
            payoutAccountNumber: payoutAccountNum || form.phone,
            payoutBankName: payoutBank || '',
            facebookUrl: form.facebook || '',
            instagramUrl: form.instagram || '',
            status: 'under_verification',
          }))
          localStorage.setItem('provider_verified', 'false')
        } catch {}
      } catch (err) {
        console.error('Provider save error:', err)
      }
    }

    setDone(true)
  }

  const allAgreed = agreed.terms && agreed.agreement && agreed.fee

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 py-3.5 px-4 sm:px-8 sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ServiceQ" className="h-8 w-8 object-contain" />
            <span className="font-bold text-gray-900 text-base">ServiceQ</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full ml-1">
              Provider Onboarding
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={14} /> Back to Home
          </button>
        </div>
      </header>

      {/* Main — Centered Form Container (O1) */}
      <main className="flex-1 flex flex-col items-center justify-start py-8 px-4 sm:px-6 w-full overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto flex flex-col flex-1">
          {/* Centered Top Progress Bar (O3) */}
          <div className="w-full flex flex-col items-center mb-6">
            {/* Stepper Dots & Line */}
            <div className="w-full max-w-md flex items-center justify-between gap-1 mb-3">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1 flex-1 last:flex-none">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-500'
                    }`}
                    title={s}
                  >
                    {i < step ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-1 flex-1 rounded-full transition-all ${i < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">{STEPS[step]}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length} · Provider Application</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6 flex-1">

              {/* O6: Enlarged Card */}
              <div className="card p-6 sm:p-8 flex flex-col gap-5 shadow-sm border border-gray-100 rounded-2xl bg-white">
                {/* STEP 0: Basic Info */}
                {step === 0 && <>
                  {(user || profile || form.fullName) && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 flex items-start gap-2.5">
                      <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Registered info auto-filled!</span>
                        <p className="text-emerald-700 mt-0.5">Your name, email, and contact info were preloaded. Please select your birthdate and upload a profile photo below.</p>
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
                        Email Address {user && <span className="text-xs text-emerald-600 font-normal">(registered)</span>}
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
                        <span className="text-xs text-amber-600 font-medium">Required</span>
                      </label>
                      <input type="date" className="input" value={form.dob} onChange={e => set('dob', e.target.value)} />
                    </div>

                    {/* Image Upload Preview (O2) */}
                    <div className="form-group sm:col-span-2">
                      <label className="label flex items-center justify-between mb-2">
                        <span>Profile Photo / Business Logo</span>
                        {!photoPreview && <span className="text-xs text-amber-600 font-medium">Recommended</span>}
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50/80 border border-gray-200 rounded-2xl">
                        {photoPreview ? (
                          <div className="relative group flex-shrink-0">
                            <img
                              src={photoPreview}
                              alt="Profile Preview"
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => setPhotoPreview(null)}
                              className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md transition-transform hover:scale-110"
                              title="Remove photo"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 flex-shrink-0">
                            <Image size={28} />
                            <span className="text-[10px] mt-1 font-medium">No photo</span>
                          </div>
                        )}

                        <div className="flex-1 flex flex-col gap-2 text-center sm:text-left min-w-0">
                          <div>
                            <p className="text-xs font-semibold text-gray-800">
                              {photoPreview ? 'Profile photo attached ✓' : 'Upload your photo or business logo'}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              This photo will appear on your provider profile, search cards, and customer chats.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 hover:border-emerald-500 text-gray-700 hover:text-emerald-700 rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                              <Upload size={14} />
                              <span>{photoPreview ? 'Change Photo' : 'Choose Photo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    setPhotoPreview(URL.createObjectURL(file))
                                    toast.success('Profile photo attached!')
                                  }
                                }}
                              />
                            </label>
                            {photoPreview && (
                              <button
                                type="button"
                                onClick={() => setPhotoPreview(null)}
                                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-2 rounded-lg hover:bg-rose-50 transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
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
                    label="Service Address / Operating Location in Cebu"
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
                      <input className="input" placeholder="e.g. Cebu City, Mandaue" value={form.serviceArea} onChange={e => set('serviceArea', e.target.value)} />
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

                {/* STEP 3: KYC with B2B ID Front & Back (O5) */}
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
                      <input className="input" value={form.idNumber} onChange={e => set('idNumber', e.target.value)} placeholder="e.g. 1234-5678-9012" />
                    </div>
                  </div>

                  {/* Separate Front & Back ID Uploads (O5) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Front Upload */}
                    <div className="form-group">
                      <label className="label">ID Photo (Front Page) *</label>
                      {idFrontPreview ? (
                        <div className="relative border border-emerald-300 rounded-xl overflow-hidden bg-gray-50">
                          <img src={idFrontPreview} alt="ID Front" className="w-full h-32 object-contain" />
                          <button
                            type="button"
                            onClick={() => setIdFrontPreview(null)}
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-rose-600 p-1 rounded-full shadow-xs"
                          >
                            <X size={14} />
                          </button>
                          <div className="text-[10px] text-center bg-emerald-600 text-white py-0.5 font-semibold">Front Attached ✓</div>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-400 bg-gray-50/40 transition-colors">
                          <Upload size={22} className="text-gray-400" />
                          <span className="text-xs font-semibold text-gray-700">Upload ID Front</span>
                          <span className="text-[10px] text-gray-400">Clear photo of the front side</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) {
                                setIdFrontPreview(URL.createObjectURL(f))
                                toast.success('ID Front attached!')
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Back Upload */}
                    <div className="form-group">
                      <label className="label">ID Photo (Back Page) *</label>
                      {idBackPreview ? (
                        <div className="relative border border-emerald-300 rounded-xl overflow-hidden bg-gray-50">
                          <img src={idBackPreview} alt="ID Back" className="w-full h-32 object-contain" />
                          <button
                            type="button"
                            onClick={() => setIdBackPreview(null)}
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-rose-600 p-1 rounded-full shadow-xs"
                          >
                            <X size={14} />
                          </button>
                          <div className="text-[10px] text-center bg-emerald-600 text-white py-0.5 font-semibold">Back Attached ✓</div>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-400 bg-gray-50/40 transition-colors">
                          <Upload size={22} className="text-gray-400" />
                          <span className="text-xs font-semibold text-gray-700">Upload ID Back</span>
                          <span className="text-[10px] text-gray-400">Clear photo of the back side</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) {
                                setIdBackPreview(URL.createObjectURL(f))
                                toast.success('ID Back attached!')
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Selfie Verification */}
                  <div className="form-group">
                    <label className="label">Selfie Verification with ID *</label>
                    {selfiePreview ? (
                      <div className="relative border border-emerald-300 rounded-xl overflow-hidden bg-gray-50 max-w-sm mx-auto">
                        <img src={selfiePreview} alt="Selfie" className="w-full h-36 object-contain" />
                        <button
                          type="button"
                          onClick={() => setSelfiePreview(null)}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white text-rose-600 p-1 rounded-full shadow-xs"
                        >
                          <X size={14} />
                        </button>
                        <div className="text-[10px] text-center bg-emerald-600 text-white py-0.5 font-semibold">Selfie Attached ✓</div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-400 bg-gray-50/40 transition-colors">
                        <span className="text-2xl">🤳</span>
                        <span className="text-xs font-semibold text-gray-700">Take or upload selfie holding ID</span>
                        <span className="text-[10px] text-gray-400">Hold your ID beside your face clearly</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) {
                              setSelfiePreview(URL.createObjectURL(f))
                              toast.success('Selfie attached!')
                            }
                          }}
                        />
                      </label>
                    )}
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
                  <div className="bg-gray-50 rounded-xl p-4 h-40 overflow-y-auto text-xs text-gray-500 leading-relaxed mb-2 border border-gray-100">
                    <strong>ServiceQ Terms & Conditions</strong><br /><br />
                    By registering as a provider on ServiceQ, you agree to maintain accurate listing information, honor all confirmed bookings, provide services as described, and adhere to all platform policies. ServiceQ reserves the right to suspend or terminate accounts that violate these terms. A platform fee of 10% is deducted from each successful booking payout...
                  </div>
                  {[
                    { key: 'terms', label: 'I have read and agree to the Terms & Conditions' },
                    { key: 'agreement', label: 'I agree to the Provider Agreement and service obligations' },
                    { key: 'fee', label: 'I understand and consent to the 10% Platform Fee per booking' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-start gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={agreed[key]} onChange={e => setAgreed(a => ({ ...a, [key]: e.target.checked }))}
                        className="mt-0.5 accent-emerald-600 w-4 h-4 rounded" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}

                  {/* O7: Warning banner if not all boxes ticked */}
                  {!allAgreed && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                      ⚠️ Please check all 3 boxes above to unlock the <strong>Submit Application</strong> button.
                    </div>
                  )}
                </>}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="flex justify-between items-center pt-6 mt-auto">
            <button onClick={back} disabled={step === 0} className="btn-ghost gap-2 disabled:opacity-30">
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              disabled={step === 5 && !allAgreed}
              className="btn-primary gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#059669' }}
            >
              {step === 5 ? 'Submit Application' : 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <Modal open={done} onClose={() => {}} title="Application Submitted! 🎉" size="sm">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl">⏳</div>
          <div>
            <h3 className="font-bold text-gray-900">Application Under Verification</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Your provider profile and credentials have been received for review. You can now access your provider dashboard, explore features, and prepare your listings!
            </p>
          </div>
          <button
            onClick={() => navigate('/provider/dashboard', { replace: true })}
            className="btn-primary w-full py-2.5 !bg-emerald-600 hover:!bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
          >
            Go to Provider Dashboard →
          </button>
        </div>
      </Modal>
    </div>
  )
}



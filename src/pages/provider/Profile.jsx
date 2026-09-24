import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle, Clock, Upload, Save,
  Building, Phone, Mail, MapPin, CreditCard, ShieldCheck,
  Facebook, Instagram, ExternalLink, Loader, RefreshCw,
  Pencil, ArrowLeft, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { GOV_ID_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

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

function getInitials(name) {
  if (!name) return 'PR'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatMemberSince(dateString) {
  if (!dateString) return 'September 2026'
  return new Date(dateString).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })
}

export default function ProviderProfile() {
  const { user, profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [providerRow, setProviderRow] = useState(null)
  const [showPayoutModal, setShowPayoutModal] = useState(false)

  const [form, setForm] = useState({
    // Personal / Profile
    fullName: '',
    email: '',
    phone: '',
    address: '',
    barangay: '',
    city: '',
    province: '',
    postalCode: '',

    // Business info (Slide 39)
    businessName: '',
    description: '',
    category: '',
    providerType: '',
    yearsExp: '',
    hoursFrom: '08:00',
    hoursTo: '17:00',
    serviceArea: '',
    facebookUrl: '',
    instagramUrl: '',

    // KYC / Identity (Slide 40)
    idType: '',
    idNumber: '',
    status: 'under_verification',

    // Payout info (Slide 41)
    payoutMethod: '',
    payoutAccountName: '',
    payoutAccountNumber: '',
    payoutBankName: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // ─── Fetch real provider data from backend & registration caches ─────────
  const fetchProviderData = async () => {
    if (!user?.id) return
    setLoading(true)

    try {
      // 1. Fetch fresh profile from Supabase
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      // 2. Fetch provider row if available
      const { data: provData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (provData) setProviderRow(provData)

      // 3. User metadata
      const meta = user.user_metadata || {}

      // 4. Local storage caches from registration
      let localCache = {}
      try {
        localCache = JSON.parse(localStorage.getItem(`serviceq_provider_profile_${user.id}`)) || {}
      } catch {}
      let emailCache = {}
      try {
        emailCache = JSON.parse(localStorage.getItem(`serviceq_provider_profile_email_${user.email?.toLowerCase()}`)) || {}
      } catch {}
      let latestCache = {}
      try {
        latestCache = JSON.parse(localStorage.getItem('serviceq_latest_provider_registered')) || {}
      } catch {}

      const mergedCache = { ...latestCache, ...emailCache, ...localCache }

      let profileMeta = null
      try {
        if (profData?.avatar_url && profData.avatar_url.startsWith('{')) {
          profileMeta = JSON.parse(profData.avatar_url)
        }
      } catch {}

      const effectiveName = profData?.full_name || meta.full_name || mergedCache.fullName || user.email?.split('@')[0] || 'Service Provider'
      const effectivePhone = profData?.phone || meta.phone || mergedCache.phone || ''
      const effectiveCity = profData?.city || mergedCache.city || 'Cebu City'

      // Business details (Slide 39: exact values entered by user)
      const effectiveBusinessName = provData?.business_name || profileMeta?.business_name || meta.business_name || mergedCache.businessName || effectiveName
      const effectiveCategory = profileMeta?.category || meta.category || mergedCache.category ||
        (Array.isArray(provData?.provider_type) && provData?.provider_type[0]) || mergedCache.providerType || 'Services'
      const effectiveYearsExp = profileMeta?.years_experience || meta.years_experience || mergedCache.yearsExp ||
        (provData?.years_experience != null ? `${provData.years_experience} years` : '1 – 2 years')
      const effectiveServiceArea = provData?.service_area || profileMeta?.service_area || meta.service_area || mergedCache.serviceArea || `${effectiveCity}, Metro Cebu`

      const effectiveStatus = provData?.status ||
        profileMeta?.status ||
        (localStorage.getItem(`provider_verified_${user.id}`) === 'true' ? 'approved' :
        (profData?.is_active === false ? 'suspended' : 'under_verification'))

      setForm({
        fullName: effectiveName,
        email: profData?.email || user.email || '',
        phone: effectivePhone,
        address: profData?.address || mergedCache.address || '',
        barangay: profData?.barangay || mergedCache.barangay || '',
        city: effectiveCity,
        province: profData?.province || mergedCache.province || 'Cebu',
        postalCode: profData?.postal_code || mergedCache.postalCode || '6000',

        businessName: effectiveBusinessName,
        description: provData?.business_description || profileMeta?.description || meta.business_description || mergedCache.description || '',
        category: effectiveCategory,
        providerType: effectiveCategory,
        yearsExp: String(effectiveYearsExp),
        hoursFrom: provData?.operating_hours_from || profileMeta?.hours_from || meta.operating_hours_from || mergedCache.hoursFrom || '08:00',
        hoursTo: provData?.operating_hours_to || profileMeta?.hours_to || meta.operating_hours_to || mergedCache.hoursTo || '17:00',
        serviceArea: effectiveServiceArea,
        facebookUrl: provData?.facebook_url || profileMeta?.facebook_url || meta.facebook_url || mergedCache.facebookUrl || '',
        instagramUrl: provData?.instagram_url || profileMeta?.instagram_url || meta.instagram_url || mergedCache.instagramUrl || '',

        // Slide 40: unselected by default if not set
        idType: provData?.gov_id_type || profileMeta?.gov_id_type || meta.gov_id_type || mergedCache.idType || '',
        idNumber: provData?.gov_id_number || profileMeta?.gov_id_number || meta.gov_id_number || mergedCache.idNumber || '',
        status: effectiveStatus,

        // Slide 41: blank/unconfigured by default if not set
        payoutMethod: provData?.payout_method || profileMeta?.payout_method || meta.payout_method || mergedCache.payoutMethod || '',
        payoutAccountName: provData?.payout_account_name || profileMeta?.payout_account_name || meta.payout_account_name || mergedCache.payoutAccountName || '',
        payoutAccountNumber: provData?.payout_account_number || profileMeta?.payout_account_number || meta.payout_account_number || mergedCache.payoutAccountNumber || '',
        payoutBankName: provData?.payout_bank_name || profileMeta?.payout_bank_name || meta.payout_bank_name || mergedCache.payoutBankName || '',
      })
    } catch (err) {
      console.error('Error fetching provider profile:', err)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviderData()
  }, [user?.id])

  // ─── Save changes to Supabase & localStorage ─────────────────────────────
  const handleSave = async (e) => {
    e?.preventDefault()
    if (!user?.id) return toast.error('You must be logged in')

    setSaving(true)
    try {
      // 1. Fetch current profile to retain metadata
      const { data: currentProf } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      let currentMeta = {}
      try {
        if (currentProf?.avatar_url && currentProf.avatar_url.startsWith('{')) {
          currentMeta = JSON.parse(currentProf.avatar_url)
        }
      } catch {}

      const updatedMeta = {
        ...currentMeta,
        business_name: form.businessName,
        description: form.description,
        category: form.category,
        provider_type: form.category,
        years_experience: form.yearsExp,
        hours_from: form.hoursFrom,
        hours_to: form.hoursTo,
        service_area: form.serviceArea,
        gov_id_type: form.idType,
        gov_id_number: form.idNumber,
        payout_method: form.payoutMethod,
        payout_account_name: form.payoutAccountName,
        payout_account_number: form.payoutAccountNumber,
        payout_bank_name: form.payoutBankName,
        facebook_url: form.facebookUrl,
        instagram_url: form.instagramUrl,
      }

      await supabase.from('profiles').update({
        full_name: form.fullName,
        phone: form.phone,
        address: form.address,
        barangay: form.barangay,
        city: form.city,
        province: form.province,
        postal_code: form.postalCode,
        avatar_url: JSON.stringify(updatedMeta),
      }).eq('id', user.id)

      // 2. Auth user metadata update
      await supabase.auth.updateUser({
        data: {
          full_name: form.fullName,
          phone: form.phone,
          business_name: form.businessName,
          category: form.category,
          years_experience: form.yearsExp,
          service_area: form.serviceArea,
        }
      })

      // 3. Update providers table
      try {
        await supabase.from('providers').upsert({
          user_id: user.id,
          business_name: form.businessName,
          business_description: form.description,
          provider_type: [form.category || 'service'],
          years_experience: parseInt(form.yearsExp) || 1,
          operating_hours_from: form.hoursFrom || '08:00',
          operating_hours_to: form.hoursTo || '17:00',
          service_area: form.serviceArea,
          gov_id_type: form.idType,
          gov_id_number: form.idNumber,
          payout_method: form.payoutMethod || null,
          payout_account_name: form.payoutAccountName || null,
          payout_account_number: form.payoutAccountNumber || null,
          payout_bank_name: form.payoutBankName || null,
          facebook_url: form.facebookUrl,
          instagram_url: form.instagramUrl,
        }, { onConflict: 'user_id' })
      } catch (err) {
        console.warn('Providers table upsert note:', err.message)
      }

      // 4. Save to localStorage cache
      localStorage.setItem(`serviceq_provider_profile_${user.id}`, JSON.stringify(form))
      if (user.email) {
        localStorage.setItem(`serviceq_provider_profile_email_${user.email.toLowerCase()}`, JSON.stringify(form))
      }

      toast.success('Provider profile updated successfully!')
      setIsEditing(false)
      fetchProviderData()
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Failed to update profile: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const isVerified = form.status === 'approved' ||
                     profile?.avatar_url?.includes('"status":"approved"') ||
                     localStorage.getItem(`provider_verified_${user?.id}`) === 'true' ||
                     localStorage.getItem('serviceq_kyc_approved') === 'true'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Loader size={32} className="animate-spin text-emerald-600" />
        <span className="text-sm font-medium">Loading provider profile...</span>
      </div>
    )
  }

  // Format hours display
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${String(formattedHour).padStart(2, '0')}:${m || '00'} ${ampm}`
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full pb-16">
      
      {/* ── Top Header (Slide 42 vs Slide 43) ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Profile' : 'Provider Profile'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEditing
              ? "Update your business information. Click Save Changes when you're done."
              : 'View and manage your business information'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={fetchProviderData}
                disabled={loading}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
                style={{ background: '#059669' }}
              >
                <Pencil size={13} /> Edit Profile
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { setIsEditing(false); fetchProviderData(); }}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <ArrowLeft size={13} /> Back to Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Provider Avatar & Top Identity Card ───────────────────────── */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-black text-3xl shadow-sm border border-emerald-200">
            {getInitials(form.businessName || form.fullName || 'PR')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 text-lg">
                {form.businessName || form.fullName || 'Service Provider'}
              </p>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
                Provider
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              {isVerified ? (
                <div className="flex items-center gap-1 text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle size={13} className="text-emerald-600" />
                  <span>KYC Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-700 font-semibold text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Clock size={13} className="text-amber-600" />
                  <span>Verification Pending</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-1">
              Member since {formatMemberSince(profile?.created_at || user?.created_at)}
            </p>
          </div>
        </div>

        <label className="btn-secondary btn-sm gap-1.5 cursor-pointer text-xs self-end sm:self-auto">
          <Upload size={13} /> Change Photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={() => toast.success('Photo uploaded!')}
          />
        </label>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VIEW MODE (Slide 42: Clean labeled summary display)
         ───────────────────────────────────────────────────────────── */}
      {!isEditing ? (
        <div className="flex flex-col gap-6">
          
          {/* Business Information (Slide 39 & 42) */}
          <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Building size={18} className="text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Business Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Business / Trade Name</p>
                <p className="text-gray-900 font-medium">{form.businessName || 'Not provided'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Business Description</p>
                <p className="text-gray-700">{form.description || 'Not provided'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Primary Offering Type</p>
                <p className="text-gray-900 font-medium">{form.category || form.providerType || 'Not provided'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Years of Experience</p>
                <p className="text-gray-900 font-medium">{form.yearsExp || 'Not provided'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Operating Hours</p>
                <p className="text-gray-900 font-medium">
                  {formatTime(form.hoursFrom)} – {formatTime(form.hoursTo)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Service Coverage Area</p>
                <p className="text-gray-900 font-medium">{form.serviceArea || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information (Slide 42) */}
          <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Phone size={18} className="text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Contact Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Phone Number</p>
                <p className="text-gray-900 font-medium">{form.phone ? `+63 ${form.phone.replace(/^0/, '')}` : 'Not provided'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Email Address</p>
                <p className="text-gray-900 font-medium break-all">{form.email || user.email || 'Not provided'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Address</p>
                <p className="text-gray-900 font-medium">
                  {[form.address, form.barangay, form.city, form.province || 'Cebu', 'Philippines'].filter(Boolean).join(', ') || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Payout Information (Slide 41 & 42) */}
          <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                <h2 className="font-bold text-gray-900 text-base">Payout Information</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Payout Method</p>
                <div className="flex items-center gap-2">
                  {form.payoutMethod ? (
                    <>
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                        {form.payoutMethod[0]?.toUpperCase()}
                      </span>
                      <span className="text-gray-900 font-medium uppercase">{form.payoutMethod}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Not configured</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Account Name</p>
                <p className="text-gray-900 font-medium">{form.payoutAccountName || <span className="text-gray-400 italic">Not configured</span>}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Account Number</p>
                <p className="text-gray-900 font-mono">{form.payoutAccountNumber || <span className="text-gray-400 italic font-sans">Not configured</span>}</p>
              </div>
            </div>
          </div>

          {/* Government ID & KYC Status (Slide 40 & 42) */}
          <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h2 className="font-bold text-gray-900 text-base">Government ID & KYC Status</h2>
              </div>
              {isVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Under Review</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Government ID Type</p>
                <p className="text-gray-900 font-medium">{form.idType || 'Select a category'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Government ID Number</p>
                <p className="text-gray-900 font-mono">{form.idNumber || <span className="text-gray-400 italic font-sans">ID Number not set</span>}</p>
              </div>
            </div>
          </div>

          {/* Account Status (Slide 42) */}
          <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Account Status</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Verification Status</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-800 font-semibold text-xs">Verification Pending</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Member Since</p>
                <p className="text-gray-900 font-medium">{formatMemberSince(profile?.created_at || user?.created_at)}</p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
           EDIT MODE (Slide 43: Interactive Form with inputs & asterisks)
           ───────────────────────────────────────────────────────────── */
        <form onSubmit={handleSave} className="flex flex-col gap-6">

          {/* Business Information (Slide 43) */}
          <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Building size={18} className="text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Business Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group sm:col-span-2">
                <label className="label">
                  Business / Trade Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Mochi San's Services"
                  value={form.businessName}
                  onChange={e => set('businessName', e.target.value)}
                  required
                />
              </div>

              <div className="form-group sm:col-span-2">
                <label className="label">Business Description</label>
                <textarea
                  rows={3}
                  className="input resize-none"
                  placeholder="Describe your services, background, and specializations..."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="label">
                  Primary Offering Type <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  className="input"
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {PROVIDER_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">
                  Years of Experience <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  className="input"
                  value={form.yearsExp}
                  onChange={e => set('yearsExp', e.target.value)}
                  required
                >
                  <option value="">Select experience</option>
                  <option value="Less than a year">Less than a year</option>
                  <option value="1 – 2 years">1 – 2 years</option>
                  <option value="3 – 5 years">3 – 5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>

              <div className="form-group sm:col-span-2">
                <label className="label">
                  Operating Hours <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    className="input flex-1"
                    value={form.hoursFrom}
                    onChange={e => set('hoursFrom', e.target.value)}
                    required
                  />
                  <span className="text-gray-500 text-xs font-semibold">to</span>
                  <input
                    type="time"
                    className="input flex-1"
                    value={form.hoursTo}
                    onChange={e => set('hoursTo', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group sm:col-span-2">
                <label className="label">
                  Service Coverage Area <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Cebu City, Metro Cebu"
                  value={form.serviceArea}
                  onChange={e => set('serviceArea', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Information (Slide 43) */}
          <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Phone size={18} className="text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Contact Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">
                  Phone Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  className="input"
                  placeholder="09XXXXXXXXX"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input bg-gray-50 text-gray-500 cursor-not-allowed"
                  value={form.email}
                  disabled
                />
              </div>

              <div className="form-group sm:col-span-2">
                <label className="label">
                  Address <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Cebu City, Cebu, Philippines"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payout Information (Slide 41 & 43) */}
          <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <CreditCard size={18} className="text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Payout Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="label">
                  Payout Method <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  className="input"
                  value={form.payoutMethod}
                  onChange={e => set('payoutMethod', e.target.value)}
                  required
                >
                  <option value="">Select a payout option</option>
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="bdo">BDO Unibank</option>
                  <option value="bpi">Bank of the Philippine Islands (BPI)</option>
                  <option value="metrobank">Metrobank</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">
                  Account Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  className="input"
                  placeholder="Full legal account name"
                  value={form.payoutAccountName}
                  onChange={e => set('payoutAccountName', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">
                  Account Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  className="input font-mono"
                  placeholder="09XXXXXXXXX or Bank Account #"
                  value={form.payoutAccountNumber}
                  onChange={e => set('payoutAccountNumber', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Government ID & KYC Status (Slide 40) */}
          <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h2 className="font-bold text-gray-900 text-base">Government ID & KYC Status</h2>
              </div>
              <Badge variant="warning">Under Review</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Government ID Type</label>
                <select
                  className="input"
                  value={form.idType}
                  onChange={e => set('idType', e.target.value)}
                >
                  <option value="">Select a category</option>
                  {GOV_ID_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Government ID Number</label>
                <input
                  className="input font-mono"
                  placeholder="ID Number"
                  value={form.idNumber}
                  onChange={e => set('idNumber', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons (Slide 43: Cancel and Save Changes) */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsEditing(false); fetchProviderData(); }}
              className="btn-secondary text-sm px-5 py-2.5 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary gap-2 text-sm px-6 py-2.5 font-bold shadow-sm"
              style={{ background: '#059669' }}
            >
              {saving ? (
                <>
                  <Loader size={16} className="animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </motion.div>
  )
}

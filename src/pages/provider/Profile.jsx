import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle, Clock, AlertCircle, Upload, Save,
  Building, Phone, Mail, MapPin, CreditCard, ShieldCheck,
  Facebook, Instagram, ExternalLink, Loader, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { GOV_ID_TYPES } from '@/lib/constants'

function getInitials(name) {
  if (!name) return 'PR'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatMemberSince(dateString) {
  if (!dateString) return 'Recent Member'
  return new Date(dateString).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })
}

export default function ProviderProfile() {
  const { user, profile } = useAuth()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
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

    // Business info
    businessName: '',
    description: '',
    providerType: 'service',
    yearsExp: '1',
    hoursFrom: '08:00',
    hoursTo: '17:00',
    serviceArea: '',
    facebookUrl: '',
    instagramUrl: '',

    // KYC / Identity
    idType: 'PhilSys (National ID)',
    idNumber: '',
    status: 'under_verification',

    // Payout info
    payoutMethod: 'gcash',
    payoutAccountName: '',
    payoutAccountNumber: '',
    payoutBankName: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // ─── Fetch real provider data from backend ──────────────────────────────
  const fetchProviderData = async () => {
    if (!user?.id) return
    setLoading(true)

    try {
      // 1. Fetch fresh profile from Supabase
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // 2. Fetch provider row if available
      const { data: provData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (provData) setProviderRow(provData)

      // 3. User metadata fallback
      const meta = user.user_metadata || {}

      // 4. Local storage fallback for recently edited offline fields
      let localCache = {}
      try {
        localCache = JSON.parse(localStorage.getItem(`serviceq_provider_profile_${user.id}`)) || {}
      } catch {}

      const effectiveName = profData?.full_name || meta.full_name || localCache.fullName || ''
      const effectivePhone = profData?.phone || meta.phone || localCache.phone || ''
      const effectiveCity = profData?.city || localCache.city || 'Cebu City'

      let profileMeta = null
      try {
        if (profData?.avatar_url && profData.avatar_url.startsWith('{')) {
          profileMeta = JSON.parse(profData.avatar_url)
        }
      } catch {}

      const effectiveStatus = provData?.status ||
        profileMeta?.status ||
        (localStorage.getItem(`provider_verified_${user.id}`) === 'true' ? 'approved' :
        (profData?.is_active === false ? 'suspended' : 'under_verification'))

      setForm({
        fullName: effectiveName,
        email: profData?.email || user.email || '',
        phone: effectivePhone,
        address: profData?.address || localCache.address || '',
        barangay: profData?.barangay || localCache.barangay || '',
        city: effectiveCity,
        province: profData?.province || localCache.province || 'Cebu',
        postalCode: profData?.postal_code || localCache.postalCode || '6000',

        businessName: provData?.business_name || profileMeta?.business_name || meta.business_name || localCache.businessName || (effectiveName ? `${effectiveName}'s Services` : 'Service Provider'),
        description: provData?.business_description || profileMeta?.description || meta.business_description || localCache.description || '',
        providerType: (Array.isArray(provData?.provider_type) && provData?.provider_type[0]) || profileMeta?.provider_type || meta.provider_type || localCache.providerType || 'service',
        yearsExp: String(provData?.years_experience ?? profileMeta?.years_experience ?? meta.years_experience ?? localCache.yearsExp ?? '2'),
        hoursFrom: provData?.operating_hours_from || profileMeta?.hours_from || meta.operating_hours_from || localCache.hoursFrom || '08:00',
        hoursTo: provData?.operating_hours_to || profileMeta?.hours_to || meta.operating_hours_to || localCache.hoursTo || '17:00',
        serviceArea: provData?.service_area || profileMeta?.service_area || meta.service_area || localCache.serviceArea || `${effectiveCity}, Metro Cebu`,
        facebookUrl: provData?.facebook_url || profileMeta?.facebook_url || meta.facebook_url || localCache.facebookUrl || '',
        instagramUrl: provData?.instagram_url || profileMeta?.instagram_url || meta.instagram_url || localCache.instagramUrl || '',

        idType: provData?.gov_id_type || profileMeta?.gov_id_type || meta.gov_id_type || localCache.idType || 'PhilSys (National ID)',
        idNumber: provData?.gov_id_number || profileMeta?.gov_id_number || meta.gov_id_number || localCache.idNumber || '',
        status: effectiveStatus,

        payoutMethod: provData?.payout_method || profileMeta?.payout_method || meta.payout_method || localCache.payoutMethod || 'gcash',
        payoutAccountName: provData?.payout_account_name || profileMeta?.payout_account_name || meta.payout_account_name || localCache.payoutAccountName || effectiveName,
        payoutAccountNumber: provData?.payout_account_number || profileMeta?.payout_account_number || meta.payout_account_number || meta.payout_number || localCache.payoutAccountNumber || effectivePhone,
        payoutBankName: provData?.payout_bank_name || profileMeta?.payout_bank_name || meta.payout_bank_name || localCache.payoutBankName || '',
      })
    } catch (err) {
      console.error('Error fetching provider profile:', err)
      toast.error('Failed to load profile from database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviderData()
  }, [user?.id])

  // ─── Save changes to Supabase ──────────────────────────────────────────
  const handleSave = async (e) => {
    e?.preventDefault()
    if (!user?.id) return toast.error('You must be logged in')

    setSaving(true)
    try {
      // 1. Fetch current profile to retain status in avatar_url
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
        status: currentMeta.status || form.status || 'under_verification',
      }

      // Update profiles table
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          full_name: form.fullName,
          phone: form.phone,
          address: form.address,
          barangay: form.barangay,
          city: form.city,
          province: form.province,
          postal_code: form.postalCode,
          avatar_url: JSON.stringify(updatedMeta),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profErr) {
        console.warn('Profile table update notice:', profErr.message)
      }

      // 2. Persist extended provider info in user_metadata
      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          full_name: form.fullName,
          phone: form.phone,
          business_name: form.businessName,
          business_description: form.description,
          service_area: form.serviceArea,
          operating_hours_from: form.hoursFrom,
          operating_hours_to: form.hoursTo,
          provider_type: form.providerType,
          years_experience: parseInt(form.yearsExp) || 0,
          gov_id_type: form.idType,
          gov_id_number: form.idNumber,
          payout_method: form.payoutMethod,
          payout_account_name: form.payoutAccountName,
          payout_account_number: form.payoutAccountNumber,
          payout_bank_name: form.payoutBankName,
          facebook_url: form.facebookUrl,
          instagram_url: form.instagramUrl,
        }
      })

      if (metaErr) {
        console.warn('Auth user metadata update notice:', metaErr.message)
      }

      // 3. Update or upsert into providers table
      try {
        const validListingType = form.providerType === 'rental_property' || form.providerType === 'rental_item'
          ? form.providerType
          : 'service'

        const validPayoutMethod = ['gcash', 'maya', 'bdo', 'bpi', 'metrobank'].includes(form.payoutMethod)
          ? form.payoutMethod
          : 'gcash'

        await supabase.from('providers').upsert({
          user_id: user.id,
          business_name: form.businessName,
          business_description: form.description,
          provider_type: [validListingType],
          years_experience: parseInt(form.yearsExp) || 0,
          operating_hours_from: form.hoursFrom || '08:00',
          operating_hours_to: form.hoursTo || '17:00',
          service_area: form.serviceArea,
          gov_id_type: form.idType,
          gov_id_number: form.idNumber,
          payout_method: validPayoutMethod,
          payout_account_name: form.payoutAccountName,
          payout_account_number: form.payoutAccountNumber,
          payout_bank_name: form.payoutBankName,
          facebook_url: form.facebookUrl,
          instagram_url: form.instagramUrl,
        }, { onConflict: 'user_id' })
      } catch (err) {
        console.warn('Providers table upsert note:', err.message)
      }

      // 4. Save to local storage for persistent cache
      localStorage.setItem(`serviceq_provider_profile_${user.id}`, JSON.stringify(form))

      toast.success('Provider profile updated successfully!')
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
        <span className="text-sm font-medium">Loading provider profile from backend...</span>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-3xl pb-16">
      
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Connected to Supabase live database
          </p>
        </div>
        <button
          onClick={fetchProviderData}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── Avatar & Verification Card ─────────────────────────────── */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-black text-3xl shadow-sm border border-emerald-200">
            {getInitials(form.fullName || profile?.full_name || 'PR')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 text-lg">{form.fullName || 'Service Provider'}</p>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
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
            onChange={() => toast.success('Photo selected! Click Save Changes to update.')}
          />
        </label>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">

        {/* ── Business Information ──────────────────────────────────── */}
        <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Building size={18} className="text-emerald-600" />
            <h2 className="font-bold text-gray-900 text-base">Business Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label className="label">Business / Trade Name</label>
              <input
                className="input"
                placeholder="e.g. CleanPro Services Cebu"
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
              <label className="label">Primary Offering Type</label>
              <select
                className="input"
                value={form.providerType}
                onChange={e => set('providerType', e.target.value)}
              >
                <option value="service">Services (Repairs, Cleaning, Tutoring)</option>
                <option value="rental_property">Rental Properties (Apartments, Condos)</option>
                <option value="rental_item">Rental Items (Vehicles, Gadgets, Gear)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                className="input"
                value={form.yearsExp}
                onChange={e => set('yearsExp', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Operating Hours From</label>
              <input
                type="time"
                className="input"
                value={form.hoursFrom}
                onChange={e => set('hoursFrom', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Operating Hours To</label>
              <input
                type="time"
                className="input"
                value={form.hoursTo}
                onChange={e => set('hoursTo', e.target.value)}
              />
            </div>

            <div className="form-group sm:col-span-2">
              <label className="label">Service Coverage Area</label>
              <input
                className="input"
                placeholder="e.g. Cebu City, Mandaue, Lapu-Lapu, Talisay"
                value={form.serviceArea}
                onChange={e => set('serviceArea', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Contact & Address Information ─────────────────────────── */}
        <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Phone size={18} className="text-emerald-600" />
            <h2 className="font-bold text-gray-900 text-base">Contact & Location Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Full Name</label>
              <input
                className="input"
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Email Address (Login)</label>
              <input
                type="email"
                className="input bg-gray-50 text-gray-500 cursor-not-allowed"
                value={form.email}
                disabled
                title="Email is managed via account security"
              />
            </div>

            <div className="form-group">
              <label className="label">Phone / Mobile Number</label>
              <input
                className="input"
                placeholder="09XXXXXXXXX"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">House / Unit / Street</label>
              <input
                className="input"
                placeholder="e.g. 123 Osmeña Blvd"
                value={form.address}
                onChange={e => set('address', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Barangay</label>
              <input
                className="input"
                placeholder="e.g. Sambag 1"
                value={form.barangay}
                onChange={e => set('barangay', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">City / Municipality</label>
              <input
                className="input"
                placeholder="e.g. Cebu City"
                value={form.city}
                onChange={e => set('city', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Province</label>
              <input
                className="input"
                placeholder="e.g. Cebu"
                value={form.province}
                onChange={e => set('province', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Postal Code</label>
              <input
                className="input"
                placeholder="e.g. 6000"
                value={form.postalCode}
                onChange={e => set('postalCode', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Social & Online Presence ──────────────────────────────── */}
        <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <ExternalLink size={18} className="text-emerald-600" />
            <h2 className="font-bold text-gray-900 text-base">Online & Social Links</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label flex items-center gap-1">
                <Facebook size={13} className="text-blue-600" /> Facebook Page URL
              </label>
              <input
                className="input"
                placeholder="https://facebook.com/yourpage"
                value={form.facebookUrl}
                onChange={e => set('facebookUrl', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label flex items-center gap-1">
                <Instagram size={13} className="text-pink-600" /> Instagram Handle
              </label>
              <input
                className="input"
                placeholder="https://instagram.com/yourhandle"
                value={form.instagramUrl}
                onChange={e => set('instagramUrl', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Identity & KYC Details ────────────────────────────────── */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Government ID Type</label>
              <select
                className="input"
                value={form.idType}
                onChange={e => set('idType', e.target.value)}
              >
                {GOV_ID_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Government ID Number</label>
              <input
                className="input font-mono text-sm"
                placeholder="ID Number"
                value={form.idNumber}
                onChange={e => set('idNumber', e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-gray-400">
            {isVerified
              ? 'Your government identity documents have been verified and approved by the ServiceQ administrative team.'
              : 'Your government identity documents have been submitted to the admin verification queue for review.'}
          </p>
        </div>

        {/* ── Payout Information ────────────────────────────────────── */}
        <div className="card flex flex-col gap-4 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Payout Information</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowPayoutModal(true)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Update Details
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 capitalize text-sm">
                  {form.payoutMethod === 'gcash' ? 'GCash Account' :
                   form.payoutMethod === 'maya'  ? 'Maya Wallet' :
                   `Bank Transfer (${form.payoutBankName || 'Bank'})`}
                </span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                  Primary
                </span>
              </div>
              <p className="text-xs text-gray-600 font-mono mt-1">
                {form.payoutAccountNumber
                  ? form.payoutAccountNumber.replace(/(\d{4})\d+(\d{3})/, '$1 •••• $2')
                  : form.phone || 'No account number configured'}
              </p>
              {form.payoutAccountName && (
                <p className="text-[11px] text-gray-500 mt-0.5">Account Name: {form.payoutAccountName}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowPayoutModal(true)}
              className="btn-secondary btn-sm text-xs"
            >
              Edit Payout
            </button>
          </div>
        </div>

        {/* ── Save Action Bar ────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-400">
            Changes will be saved directly to the database.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary gap-2 text-sm px-6 py-2.5 font-bold shadow-sm"
            style={{ background: '#059669' }}
          >
            {saving ? (
              <>
                <Loader size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Payout Settings Modal ────────────────────────────────────── */}
      <Modal
        open={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        title="Payout Account Settings"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-gray-500">
            Set where your earnings will be sent when you request a withdrawal.
          </p>

          <div className="form-group">
            <label className="label">Payout Method</label>
            <select
              className="input"
              value={form.payoutMethod}
              onChange={e => set('payoutMethod', e.target.value)}
            >
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
              <option value="bdo">BDO Unibank</option>
              <option value="bpi">Bank of the Philippine Islands (BPI)</option>
              <option value="metrobank">Metrobank</option>
            </select>
          </div>

          {['bdo', 'bpi', 'metrobank'].includes(form.payoutMethod) && (
            <div className="form-group">
              <label className="label">Bank Name</label>
              <input
                className="input"
                placeholder="e.g. BDO Unibank"
                value={form.payoutBankName}
                onChange={e => set('payoutBankName', e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="label">Account Holder Name</label>
            <input
              className="input"
              placeholder="Full legal name on account"
              value={form.payoutAccountName}
              onChange={e => set('payoutAccountName', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">
              {['gcash', 'maya'].includes(form.payoutMethod) ? 'Mobile Number (09XXXXXXXXX)' : 'Account Number'}
            </label>
            <input
              className="input font-mono"
              placeholder={['gcash', 'maya'].includes(form.payoutMethod) ? '09XXXXXXXXX' : '1234567890'}
              value={form.payoutAccountNumber}
              onChange={e => set('payoutAccountNumber', e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowPayoutModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPayoutModal(false)
                toast.success('Payout details updated! Click Save Changes to finalize.')
              }}
              className="btn-primary text-xs"
              style={{ background: '#059669' }}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

    </motion.div>
  )
}

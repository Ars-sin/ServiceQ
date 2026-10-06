import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { User, Mail, Phone, MapPin, Bell, Lock, ChevronDown, ChevronUp, Save, Loader, Pencil, Eye, EyeOff, CheckCircle2, Circle, X, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getFavoriteIds } from '@/lib/favorites'
import Modal from '@/components/ui/Modal'
import { deleteAccountCompletely } from '@/lib/accountDeletion'

const TABS = ['Profile', 'Transaction History', 'Help & FAQ', 'Settings']

const FAQ_ITEMS = [
  { q: 'How do I book a service?',       a: 'Browse listings on the Discover page, select a listing, choose your preferred date and duration, then click Book Now. You will be directed to checkout.' },
  { q: 'How do I pay for bookings?',     a: 'We accept GCash, Maya, Credit/Debit Cards, and Cash on Service. Select your preferred method at checkout.' },
  { q: 'Can I cancel a booking?',        a: 'Yes, you can cancel a Scheduled booking from My Bookings. Cancellation policies vary per provider. Refunds are processed within 3–5 business days.' },
  { q: 'How are providers verified?',    a: 'All service providers undergo identity verification and background checks before they can list services on ServiceQ.' },
  { q: 'What is the platform fee?',      a: 'ServiceQ charges a 10% platform fee on each transaction to maintain the platform, payment security, and customer support.' },
]

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition">
        <span className="font-medium text-gray-800 text-sm">{item.q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-500 bg-gray-50 border-t border-gray-100">
          {item.a}
        </div>
      )}
    </div>
  )
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatMemberSince(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })
}

export default function CustomerProfile() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('Profile')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const handleDeleteAccount = async () => {
    if (!user) return
    setDeletingAccount(true)
    try {
      await deleteAccountCompletely(
        {
          id: user.id,
          email: user.email,
          name: profileForm.fullName || profile?.full_name,
          role: 'customer',
        },
        'Customer (Self)'
      )
      toast.success('Your account and all associated data have been permanently deleted.')
      setShowDeleteModal(false)
      if (signOut) await signOut()
      else await supabase.auth.signOut()
      navigate('/', { replace: true })
    } catch (err) {
      toast.error('Failed to delete account: ' + err.message)
    } finally {
      setDeletingAccount(false)
    }
  }

  // ── Profile form — seeded from Supabase profile ──────────────────
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email:    '',
    phone:    '',
    address:  '',
    city:     '',
    province: '',
    barangay: '',
    postal_code: '',
  })

  // ── Sync form when profile loads / changes ────────────────────────
  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName:    profile.full_name    ?? '',
        email:       profile.email        ?? user?.email ?? '',
        phone:       profile.phone        ?? '',
        address:     profile.address      ?? '',
        city:        profile.city         ?? '',
        province:    profile.province     ?? '',
        barangay:    profile.barangay     ?? '',
        postal_code: profile.postal_code  ?? '',
      })
    }
  }, [profile, user])

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [notifications, setNotifications] = useState({
    bookingUpdates: true,
    promotions:     false,
    reminders:      true,
    newsletter:     false,
  })

  // ── Calculate dynamic stats for customer (Slide 13: default 0 for new users) ──
  const bookingCount = useMemo(() => {
    try {
      const key = user?.id ? `serviceq_customer_bookings_${user.id}` : 'serviceq_customer_bookings'
      const stored = JSON.parse(localStorage.getItem(key))
      if (Array.isArray(stored)) return stored.filter(b => b.status !== 'cancelled').length
    } catch {}
    return 0
  }, [user?.id])

  const reviewCount = useMemo(() => {
    try {
      const key = user?.id ? `serviceq_customer_bookings_${user.id}` : 'serviceq_customer_bookings'
      const stored = JSON.parse(localStorage.getItem(key))
      if (Array.isArray(stored)) return stored.filter(b => b.reviewed).length
    } catch {}
    return 0
  }, [user?.id])

  const savedCount = useMemo(() => {
    return getFavoriteIds().length
  }, [])

  // ── Derive transactions from user's actual bookings (Slide 14: default empty) ──
  const transactions = useMemo(() => {
    try {
      const key = user?.id ? `serviceq_customer_bookings_${user.id}` : 'serviceq_customer_bookings'
      const stored = JSON.parse(localStorage.getItem(key))
      if (Array.isArray(stored) && stored.length > 0) {
        return stored.map(b => ({
          id: b.id,
          service: b.service,
          date: b.date,
          amount: b.amount,
          status: b.status === 'cancelled' ? 'Cancelled' : b.status === 'refunded' ? 'Refunded' : 'Paid'
        }))
      }
    } catch {}
    return []
  }, [user?.id])

  // ── Password requirements validation (SQI-10) ──
  const newPass = passwordForm.newPass || ''
  const hasMinLength = newPass.length >= 8
  const hasUppercase = /[A-Z]/.test(newPass)
  const hasLowercase = /[a-z]/.test(newPass)
  const hasNumber    = /[0-9]/.test(newPass)
  const hasSpecial   = /[^A-Za-z0-9]/.test(newPass)
  const passwordsMatch = Boolean(passwordForm.confirm && newPass === passwordForm.confirm)

  const isPasswordValid = Boolean(
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch
  )

  // ── Save profile to Supabase ───────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!user?.id) return toast.error('Not logged in.')
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name:   profileForm.fullName,
          phone:       profileForm.phone,
          address:     profileForm.address,
          city:        profileForm.city,
          province:    profileForm.province,
          barangay:    profileForm.barangay,
          postal_code: profileForm.postal_code,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      toast.error(err.message ?? 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  // ── Change password via Supabase Auth (SQI-10) ────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!isPasswordValid) return toast.error('Please meet all password requirements before updating.')
    setPwLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
      if (error) throw error
      toast.success('Password updated successfully! Please sign in with your new password.')
      setPasswordForm({ current: '', newPass: '', confirm: '' })
      await supabase.auth.signOut()
      navigate('/login?role=customer')
    } catch (err) {
      toast.error(err.message ?? 'Password update failed.')
    } finally {
      setPwLoading(false)
    }
  }

  const inputClass = isEditing
    ? 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white transition'
    : 'w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50/80 text-gray-700 cursor-default'
  const labelClass = 'text-xs font-medium text-gray-600 block mb-1.5'

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-2 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="flex flex-col md:flex-row gap-8">

          {/* ── Left Sidebar ─────────────────────────────────────── */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              {/* Avatar with initials */}
              <div className="w-20 h-20 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                {getInitials(profileForm.fullName || profile?.full_name)}
              </div>

              <h2 className="font-bold text-gray-900">
                {profileForm.fullName || profile?.full_name || 'Loading…'}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5 break-all">
                {profileForm.email || user?.email || ''}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Member since {formatMemberSince(user?.created_at)}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-around text-center">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{bookingCount}</p>
                    <p className="text-xs text-gray-400">Bookings</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{reviewCount}</p>
                    <p className="text-xs text-gray-400">Reviews</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{savedCount}</p>
                    <p className="text-xs text-gray-400">Saved</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab nav */}
            <div className="bg-white rounded-2xl border border-gray-100 mt-4 overflow-hidden">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-5 py-3 text-sm font-medium transition border-b border-gray-50 last:border-0 ${
                    activeTab === tab
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* ── Main Content ─────────────────────────────────────── */}
          <div className="flex-1">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

              {/* ── Profile Tab ──────────────────────────────────── */}
              {activeTab === 'Profile' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {isEditing ? 'Edit Profile' : 'Profile Information'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isEditing
                          ? 'Update your personal details below and click Save Changes.'
                          : 'Your information is auto-filled from your registered account.'}
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold px-4 py-2 border-brand-200 text-brand-700 hover:bg-brand-50"
                      >
                        <Pencil size={13} /> Edit Profile
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleProfileSave} className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={profileForm.fullName}
                          readOnly={!isEditing}
                          onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))}
                          placeholder="Enter your full name"
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>

                    {/* Email — read-only, cannot change email here */}
                    <div>
                      <label className={labelClass}>Email Address <span className="text-gray-300">(cannot be changed here)</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" value={profileForm.email}
                          readOnly
                          className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50/80 text-gray-500 cursor-not-allowed pl-10" />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={profileForm.phone}
                          readOnly={!isEditing}
                          onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="09XXXXXXXXX"
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className={labelClass}>Street Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={profileForm.address}
                          readOnly={!isEditing}
                          onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))}
                          placeholder="Street, subdivision, or building"
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>

                    {/* Barangay + City */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Barangay</label>
                        <input
                          type="text"
                          value={profileForm.barangay}
                          readOnly={!isEditing}
                          onChange={e => setProfileForm(f => ({ ...f, barangay: e.target.value }))}
                          placeholder="Barangay"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>City / Municipality</label>
                        <input
                          type="text"
                          value={profileForm.city}
                          readOnly={!isEditing}
                          onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="Cebu City"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Province + Postal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Province</label>
                        <input
                          type="text"
                          value={profileForm.province}
                          readOnly={!isEditing}
                          onChange={e => setProfileForm(f => ({ ...f, province: e.target.value }))}
                          placeholder="Cebu"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Postal Code</label>
                        <input
                          type="text"
                          value={profileForm.postal_code}
                          readOnly={!isEditing}
                          onChange={e => setProfileForm(f => ({ ...f, postal_code: e.target.value }))}
                          placeholder="6000"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Action buttons (only displayed in Edit Profile mode - Slide 13) */}
                    {isEditing && (
                      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            if (profile) {
                              setProfileForm({
                                fullName:    profile.full_name    ?? '',
                                email:       profile.email        ?? user?.email ?? '',
                                phone:       profile.phone        ?? '',
                                address:     profile.address      ?? '',
                                city:        profile.city         ?? '',
                                province:    profile.province     ?? '',
                                barangay:    profile.barangay     ?? '',
                                postal_code: profile.postal_code  ?? '',
                              })
                            }
                            setIsEditing(false)
                          }}
                          className="btn-secondary px-5 py-2 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="btn-primary gap-2 min-w-[140px]"
                        >
                          {saving
                            ? <><Loader size={15} className="animate-spin" /> Saving…</>
                            : <><Save size={15} /> Save Changes</>
                          }
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* ── Transaction History (Slide 14: empty by default for new users) ── */}
              {activeTab === 'Transaction History' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-6">Transaction History</h3>
                  {transactions.length === 0 ? (
                    <div className="text-center py-14 text-gray-400 flex flex-col items-center justify-center gap-2">
                      <p className="text-4xl mb-1">🧾</p>
                      <p className="font-semibold text-gray-700 text-sm">No transaction records yet</p>
                      <p className="text-xs text-gray-400 max-w-sm">
                        Once you book or complete a service or rental, your transaction history and receipts will be displayed here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm text-gray-800">{tx.service}</p>
                            <p className="text-xs text-gray-400">{tx.date} · {tx.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-brand-700">₱{tx.amount.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              tx.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Help & FAQ ──────────────────────────────────── */}
              {activeTab === 'Help & FAQ' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-6">Help & FAQ</h3>
                  <div className="space-y-3">
                    {FAQ_ITEMS.map((item, i) => <FAQItem key={i} item={item} />)}
                  </div>
                  <div className="mt-8 p-4 bg-brand-50 rounded-xl text-center">
                    <p className="text-sm text-brand-700 font-medium">Still need help?</p>
                    <p className="text-xs text-brand-500 mt-1">Contact us at support@serviceq.ph</p>
                  </div>
                </div>
              )}

              {/* ── Settings ─────────────────────────────────────── */}
              {activeTab === 'Settings' && (
                <div className="space-y-6">
                  {/* Change Password (SQI-10: Password requirements & filled button when valid) */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-brand-600" /> Change Password
                    </h3>
                    <p className="text-xs text-gray-400 mb-5">
                      Password changes are applied immediately to your account. Please satisfy all requirements below.
                    </p>

                    <form onSubmit={handlePasswordChange} className="space-y-5">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Inputs column */}
                        <div className="lg:col-span-7 space-y-4">
                          {/* New Password */}
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">New Password</label>
                            <div className="relative">
                              <input
                                type={showNewPass ? 'text' : 'password'}
                                placeholder="Enter new password (min. 8 characters)"
                                value={passwordForm.newPass}
                                onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                                className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 transition ${
                                  passwordForm.newPass.length > 0
                                    ? hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial
                                      ? 'border-emerald-400 focus:ring-emerald-300'
                                      : 'border-amber-300 focus:ring-amber-200'
                                    : 'border-gray-200 focus:ring-brand-400'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPass(!showNewPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* Confirm Password */}
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Confirm New Password</label>
                            <div className="relative">
                              <input
                                type={showConfirmPass ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                value={passwordForm.confirm}
                                onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 transition ${
                                  passwordForm.confirm.length > 0
                                    ? passwordsMatch
                                      ? 'border-emerald-400 focus:ring-emerald-300'
                                      : 'border-red-300 focus:ring-red-200'
                                    : 'border-gray-200 focus:ring-brand-400'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Requirements Box (SQI-10) */}
                        <div className="lg:col-span-5 bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-center">
                          <p className="text-xs font-semibold text-gray-600 mb-2.5">Your new password must have:</p>
                          <ul className="space-y-2 text-xs">
                            <li className="flex items-center gap-2 text-gray-600">
                              {hasMinLength ? (
                                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Circle size={15} className="text-gray-300 flex-shrink-0" />
                              )}
                              <span>At least 8 characters</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-600">
                              {hasUppercase ? (
                                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Circle size={15} className="text-gray-300 flex-shrink-0" />
                              )}
                              <span>One uppercase letter (A–Z)</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-600">
                              {hasLowercase ? (
                                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Circle size={15} className="text-gray-300 flex-shrink-0" />
                              )}
                              <span>One lowercase letter (a–z)</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-600">
                              {hasNumber ? (
                                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Circle size={15} className="text-gray-300 flex-shrink-0" />
                              )}
                              <span>One number (0–9)</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-600">
                              {hasSpecial ? (
                                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Circle size={15} className="text-gray-300 flex-shrink-0" />
                              )}
                              <span>One special character (e.g. !@#$)</span>
                            </li>
                            {passwordForm.confirm && (
                              <li className="flex items-center gap-2 pt-1 border-t border-gray-200">
                                {passwordsMatch ? (
                                  <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                                ) : (
                                  <X size={15} className="text-red-500 flex-shrink-0" />
                                )}
                                <span className={passwordsMatch ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                                </span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Action buttons (SQI-10: Filled button when requirements are met) */}
                      <div className="flex items-center justify-start gap-3 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setPasswordForm({ current: '', newPass: '', confirm: '' })}
                          disabled={!passwordForm.newPass && !passwordForm.confirm}
                          className={`text-xs px-5 py-2.5 rounded-xl font-semibold transition-all border ${
                            passwordForm.newPass || passwordForm.confirm
                              ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 cursor-pointer shadow-xs'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={pwLoading || !isPasswordValid}
                          className={`text-xs px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${
                            isPasswordValid && !pwLoading
                              ? 'bg-brand-600 hover:bg-brand-700 text-white cursor-pointer active:scale-95'
                              : 'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                          }`}
                        >
                          {pwLoading ? (
                            <>
                              <Loader size={14} className="animate-spin" /> Updating…
                            </>
                          ) : (
                            'Update Password'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Notifications */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-brand-600" /> Notifications
                    </h3>
                    <div className="space-y-4">
                      {[
                        { key: 'bookingUpdates', label: 'Booking Updates',       desc: 'Get notified about your booking status changes' },
                        { key: 'promotions',     label: 'Promotions & Offers',   desc: 'Receive exclusive deals and discounts' },
                        { key: 'reminders',      label: 'Booking Reminders',     desc: 'Reminders before your scheduled service' },
                        { key: 'newsletter',     label: 'Newsletter',            desc: 'Weekly ServiceQ tips and highlights' },
                      ].map(n => (
                        <div key={n.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{n.label}</p>
                            <p className="text-xs text-gray-400">{n.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              notifications[n.key] ? 'bg-brand-600' : 'bg-gray-200'
                            }`}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              notifications[n.key] ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone: Delete Account */}
                  <div className="bg-white rounded-2xl border border-red-100 p-6">
                    <h3 className="font-bold text-red-600 mb-1 flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-red-500" /> Danger Zone
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Permanently delete your account and all associated bookings, reviews, and transaction history.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-red-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Delete Account</p>
                        <p className="text-xs text-gray-400">Once deleted, your account and data cannot be recovered.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account Permanently" size="sm">
        <div className="flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Trash2 size={24} />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-gray-900 text-base">Permanently Delete Account?</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Are you sure you want to delete your account? All your profile information, bookings, transactions, and reviews will be permanently wiped from both our database and local storage. This action is irreversible.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary flex-1 text-xs"
            >
              Cancel
            </button>
            <button
              disabled={deletingAccount}
              onClick={handleDeleteAccount}
              className="btn-danger flex-1 text-xs"
            >
              {deletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

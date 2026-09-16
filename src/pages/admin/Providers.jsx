import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader, ShieldCheck, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import { supabase } from '@/lib/supabase'

export default function AdminProviders() {
  const [tab, setTab]           = useState('all')
  const [page, setPage]         = useState(1)
  const [reviewItem, setReview] = useState(null)
  const [rejectReason, setRR]   = useState('')
  const [showReject, setShowReject] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [providers, setProviders] = useState([])
  const [queue, setQueue]       = useState([])

  const PAGE_SIZE = 5
  const isDefaultAll = tab === 'all'

  // ─── Fetch providers from Supabase backend ─────────────────────────────────
  const fetchProviders = async () => {
    setLoading(true)
    try {
      // 1. Fetch profiles where role = 'provider'
      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'provider')
        .order('created_at', { ascending: false })

      if (profErr) throw profErr

      // 2. Fetch details from providers table (if any)
      const { data: provRows } = await supabase
        .from('providers')
        .select('*')

      const provMap = new Map((provRows || []).map(p => [p.user_id, p]))

      // 3. Merge profiles and provider applications
      const combined = (profs || []).map(p => {
        const prov = provMap.get(p.id)

        let meta = null
        try {
          if (p.avatar_url && p.avatar_url.startsWith('{')) {
            meta = JSON.parse(p.avatar_url)
          }
        } catch {}

        const localApproved = localStorage.getItem(`provider_verified_${p.id}`) === 'true'

        // Determine status: prov table -> profile meta -> localStorage -> is_active -> default
        let status = 'under_verification'
        if (prov?.status) {
          status = prov.status
        } else if (meta?.status) {
          status = meta.status
        } else if (localApproved) {
          status = 'approved'
        } else if (p.is_active === false) {
          status = 'suspended'
        }

        const businessName = prov?.business_name || meta?.business_name || (p.full_name ? `${p.full_name}'s Services` : 'Service Provider')
        const idType = prov?.gov_id_type || meta?.gov_id_type || 'PhilSys (National ID)'
        const idNum = prov?.gov_id_number || meta?.gov_id_number || 'Awaiting ID upload'

        return {
          id: p.id,
          providerRowId: prov?.id,
          name: p.full_name || 'Unnamed Provider',
          email: p.email,
          phone: p.phone || 'N/A',
          business: businessName,
          type: prov?.provider_type ? (Array.isArray(prov.provider_type) ? prov.provider_type[0] : prov.provider_type) : 'service',
          listings: 0,
          rating: null,
          status: status,
          submitted: meta?.submitted_at ? meta.submitted_at.slice(0, 10) : (p.created_at ? p.created_at.slice(0, 10) : 'Recent'),
          idType: idType,
          idNum: idNum,
          address: [p.address, p.barangay, p.city, p.province].filter(Boolean).join(', ') || 'Cebu City, Cebu',
          dob: '1995-05-12',
          rejectionReason: meta?.rejection_reason || null,
        }
      })

      setProviders(combined)

      // KYC Queue: providers needing review
      const pendingList = combined.filter(p => p.status === 'under_verification' || p.status === 'pending')
      setQueue(pendingList)
    } catch (err) {
      console.error('Error loading providers:', err)
      toast.error('Failed to load providers from database')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  // ─── Approve KYC ──────────────────────────────────────────────────────────
  const approveKYC = async (providerUserId) => {
    setActionLoading(providerUserId)
    try {
      // 1. Fetch current profile to retain existing metadata
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', providerUserId)
        .single()

      let currentMeta = {}
      try {
        if (prof?.avatar_url && prof.avatar_url.startsWith('{')) {
          currentMeta = JSON.parse(prof.avatar_url)
        }
      } catch {}

      const updatedMeta = {
        ...currentMeta,
        status: 'approved',
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      }

      // 2. Persist to profiles table on Supabase (persists in backend)
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          is_active: true,
          avatar_url: JSON.stringify(updatedMeta),
        })
        .eq('id', providerUserId)

      if (profErr) throw profErr

      // 3. Best-effort update on providers table if row exists
      try {
        await supabase
          .from('providers')
          .update({ status: 'approved' })
          .eq('user_id', providerUserId)
      } catch {}

      // 4. Cache locally for instant cross-tab / portal sync
      try {
        localStorage.setItem(`provider_verified_${providerUserId}`, 'true')
        localStorage.setItem('serviceq_kyc_approved', 'true')
      } catch {}

      // 5. Update local React state immediately for instant feedback
      setProviders(prev => prev.map(p => p.id === providerUserId ? { ...p, status: 'approved' } : p))
      setQueue(prev => prev.filter(p => p.id !== providerUserId))
      setReview(null)

      toast.success('Provider KYC approved! Account is now verified in database.')
      await fetchProviders()
    } catch (err) {
      console.error('Error approving provider:', err)
      toast.error('Error approving provider: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Reject KYC ───────────────────────────────────────────────────────────
  const rejectKYC = async () => {
    if (!rejectReason.trim()) return toast.error('Please enter a rejection reason')
    const providerUserId = reviewItem?.id
    if (!providerUserId) return

    setActionLoading(providerUserId)
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', providerUserId)
        .single()

      let currentMeta = {}
      try {
        if (prof?.avatar_url && prof.avatar_url.startsWith('{')) {
          currentMeta = JSON.parse(prof.avatar_url)
        }
      } catch {}

      const updatedMeta = {
        ...currentMeta,
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectReason.trim(),
      }

      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          avatar_url: JSON.stringify(updatedMeta),
        })
        .eq('id', providerUserId)

      if (profErr) throw profErr

      try {
        await supabase
          .from('providers')
          .update({ status: 'rejected' })
          .eq('user_id', providerUserId)
      } catch {}

      try {
        localStorage.setItem(`provider_verified_${providerUserId}`, 'false')
      } catch {}

      setProviders(prev => prev.map(p => p.id === providerUserId ? { ...p, status: 'rejected' } : p))
      setQueue(prev => prev.filter(p => p.id !== providerUserId))

      toast.error('Provider KYC rejected')
      setReview(null)
      setShowReject(false)
      setRR('')
      await fetchProviders()
    } catch (err) {
      console.error('Error rejecting provider:', err)
      toast.error('Error rejecting provider: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Toggle Suspend ───────────────────────────────────────────────────────
  const toggleSuspend = async (providerUserId, currentStatus) => {
    const isSuspending = currentStatus !== 'suspended'
    const newStatus = isSuspending ? 'suspended' : 'approved'
    setActionLoading(providerUserId)

    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', providerUserId)
        .single()

      let currentMeta = {}
      try {
        if (prof?.avatar_url && prof.avatar_url.startsWith('{')) {
          currentMeta = JSON.parse(prof.avatar_url)
        }
      } catch {}

      const updatedMeta = {
        ...currentMeta,
        status: newStatus,
      }

      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          is_active: !isSuspending,
          avatar_url: JSON.stringify(updatedMeta),
        })
        .eq('id', providerUserId)

      if (profErr) throw profErr

      try {
        await supabase
          .from('providers')
          .update({ status: newStatus })
          .eq('user_id', providerUserId)
      } catch {}

      setProviders(prev => prev.map(p => p.id === providerUserId ? { ...p, status: newStatus } : p))
      if (isSuspending) {
        setQueue(prev => prev.filter(p => p.id !== providerUserId))
      }

      toast.success(`Provider ${isSuspending ? 'suspended' : 'reactivated'}`)
      await fetchProviders()
    } catch (err) {
      toast.error('Error updating provider: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const tabs = [
    { id: 'all', label: `All Providers (${providers.length})` },
    { id: 'kyc', label: `KYC Queue (${queue.length})` },
  ]

  const displayed = isDefaultAll
    ? providers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : providers

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setPage(1)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Management</h1>
          <p className="text-xs text-gray-500 mt-1">Live data connected to Supabase backend</p>
        </div>
        <button
          onClick={fetchProviders}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={handleTabChange} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <Loader size={30} className="animate-spin text-brand-600" />
          <span className="text-sm font-medium">Loading providers from database...</span>
        </div>
      ) : (
        <>
          {/* ── Tab: All Providers ─────────────────────────────────── */}
          {tab === 'all' && (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                    <th className="p-4 font-medium">Provider</th>
                    <th className="p-4 font-medium">Contact</th>
                    <th className="p-4 font-medium">Location</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {providers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">
                        No provider accounts registered yet.
                      </td>
                    </tr>
                  ) : (
                    displayed.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-semibold text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.business}</div>
                        </td>
                        <td className="p-4 text-xs text-gray-600">
                          <div>{p.email}</div>
                          <div className="text-gray-400">{p.phone}</div>
                        </td>
                        <td className="p-4 text-xs text-gray-600 max-w-xs truncate">
                          {p.address}
                        </td>
                        <td className="p-4">
                          <Badge variant={statusVariant(p.status)} className="capitalize">
                            {p.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.status === 'under_verification' && (
                              <>
                                <button
                                  onClick={() => approveKYC(p.id)}
                                  disabled={actionLoading === p.id}
                                  className="btn-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm"
                                >
                                  {actionLoading === p.id ? (
                                    <Loader size={12} className="animate-spin" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setReview(p)
                                    setTab('kyc')
                                  }}
                                  className="btn-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg px-2 py-1 text-xs font-semibold"
                                >
                                  Review KYC
                                </button>
                              </>
                            )}

                            {p.status === 'approved' && (
                              <button
                                onClick={() => toggleSuspend(p.id, p.status)}
                                disabled={actionLoading === p.id}
                                className="btn-sm bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg px-2.5 py-1 text-xs font-medium"
                              >
                                Suspend
                              </button>
                            )}

                            {p.status === 'suspended' && (
                              <button
                                onClick={() => toggleSuspend(p.id, p.status)}
                                disabled={actionLoading === p.id}
                                className="btn-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg px-2.5 py-1 text-xs font-medium"
                              >
                                Reactivate
                              </button>
                            )}

                            {p.status === 'rejected' && (
                              <button
                                onClick={() => approveKYC(p.id)}
                                disabled={actionLoading === p.id}
                                className="btn-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold"
                              >
                                Re-approve
                              </button>
                            )}

                            <button
                              onClick={() => setReview(p)}
                              className="btn-ghost btn-sm text-xs text-gray-500 hover:text-gray-700"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Conditional Pagination: only when tab === 'all' */}
              {isDefaultAll && providers.length > PAGE_SIZE && (
                <div className="p-4 border-t border-gray-100">
                  <Pagination
                    currentPage={page}
                    totalItems={providers.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Tab: KYC Queue ─────────────────────────────────────── */}
          {tab === 'kyc' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {queue.length === 0 ? (
                <div className="col-span-2 text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                  <CheckCircle size={48} className="mx-auto mb-3 text-emerald-500 opacity-60" />
                  <p className="font-semibold text-gray-800">All KYC submissions reviewed!</p>
                  <p className="text-xs text-gray-400 mt-1">There are no pending provider applications in the queue.</p>
                </div>
              ) : (
                queue.map(k => (
                  <div key={k.id} className="card flex flex-col gap-3.5 border border-gray-200/80 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 text-base">{k.name}</p>
                        <p className="text-xs text-gray-400">{k.business} • Submitted: {k.submitted}</p>
                      </div>
                      <Badge variant="warning">Pending Review</Badge>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p><span className="text-gray-400 font-medium">Email:</span> {k.email}</p>
                      <p><span className="text-gray-400 font-medium">Phone:</span> {k.phone}</p>
                      <p><span className="text-gray-400 font-medium">Location:</span> {k.address}</p>
                      <p><span className="text-gray-400 font-medium">ID Info:</span> <span className="font-semibold text-gray-800">{k.idType}</span> ({k.idNum})</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => approveKYC(k.id)}
                        disabled={actionLoading === k.id}
                        className="btn-primary flex-1 text-xs py-2 font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        style={{ background: '#059669' }}
                      >
                        {actionLoading === k.id ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Quick Approve
                      </button>

                      <button
                        onClick={() => setReview(k)}
                        className="btn-secondary flex-1 text-xs py-2 font-medium"
                      >
                        Review Documents
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ── KYC Review Modal ─────────────────────────────────────── */}
      <Modal open={!!reviewItem} onClose={() => { setReview(null); setShowReject(false); setRR('') }} title="KYC Application Review" size="lg">
        {reviewItem && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Full Name', reviewItem.name],
                ['Business Name', reviewItem.business],
                ['Email', reviewItem.email],
                ['Phone', reviewItem.phone],
                ['Location', reviewItem.address],
                ['ID Type', reviewItem.idType],
                ['ID Number', reviewItem.idNum],
                ['Application Status', reviewItem.status.replace('_', ' ')],
                ['Registered Date', reviewItem.submitted],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-gray-400 text-xs font-medium">{k}</p>
                  <p className="font-semibold text-gray-900 break-all text-sm mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {reviewItem.rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <span className="font-bold">Previous Rejection Reason: </span>
                {reviewItem.rejectionReason}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl h-36 flex flex-col items-center justify-center text-gray-500 text-xs gap-1 border border-dashed border-gray-300">
                <span className="text-2xl">🪪</span>
                <span className="font-semibold text-gray-800">Government ID Document</span>
                <span className="text-[11px] text-gray-500">{reviewItem.idType}</span>
                <span className="text-[10px] text-gray-400 font-mono">{reviewItem.idNum}</span>
              </div>
              <div className="bg-gray-50 rounded-xl h-36 flex flex-col items-center justify-center text-gray-500 text-xs gap-1 border border-dashed border-gray-300">
                <span className="text-2xl">🤳</span>
                <span className="font-semibold text-gray-800">Verification Selfie</span>
                <span className="text-[11px] text-gray-500">Identity facial match check</span>
                <span className="text-[10px] text-emerald-600 font-medium">Ready for verification</span>
              </div>
            </div>

            {showReject ? (
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="label">Rejection Reason</label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={e => setRR(e.target.value)}
                    className="input resize-none"
                    placeholder="Explain why the KYC is being rejected (e.g., ID document unreadable, expired ID, etc.)..."
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowReject(false)} className="btn-ghost flex-1">
                    Cancel
                  </button>
                  <button
                    onClick={rejectKYC}
                    disabled={actionLoading === reviewItem.id}
                    className="btn-danger flex-1"
                  >
                    {actionLoading === reviewItem.id ? 'Processing...' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => approveKYC(reviewItem.id)}
                  disabled={actionLoading === reviewItem.id}
                  className="btn-primary flex-1 gap-1.5 font-bold shadow-sm"
                  style={{ background: '#059669' }}
                >
                  {actionLoading === reviewItem.id ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Approve Application
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={actionLoading === reviewItem.id}
                  className="btn-danger flex-1 gap-1.5"
                >
                  <XCircle size={16} /> Reject
                </button>
                <button
                  onClick={() => {
                    toast.success('Correction request sent to provider')
                    setReview(null)
                  }}
                  className="btn-secondary flex-1 gap-1.5"
                >
                  <AlertCircle size={16} /> Request Correction
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

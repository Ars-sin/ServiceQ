import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { statusVariant } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

const ALL_PROVIDERS = [
  { id: '1', name: 'Maria Santos',  business: 'MS Cleaning',     type: 'Service',  listings: 4, rating: 4.8, status: 'approved' },
  { id: '2', name: 'TechRent PH',   business: 'TechRent PH',     type: 'Rental',   listings: 8, rating: 4.9, status: 'approved' },
  { id: '3', name: 'Events Pro',    business: 'Events Pro',       type: 'Both',     listings: 6, rating: 4.6, status: 'approved' },
  { id: '4', name: 'Juan Dela Cruz',business: 'Juan DC Services', type: 'Service',  listings: 0, rating: null, status: 'under_verification' },
  { id: '5', name: 'Riza Mercado',  business: 'Riza Rentals',    type: 'Rental',   listings: 0, rating: null, status: 'rejected' },
]

const KYC_QUEUE = [
  { id: 'k1', name: 'Juan Dela Cruz', idType: 'PhilSys (National ID)', idNum: '1234-5678-9012', submitted: '2026-09-06', dob: '1995-03-22', phone: '09181234567' },
  { id: 'k2', name: 'Riza Mercado',   idType: "Driver's License",       idNum: 'N02-00-123456',   submitted: '2026-09-05', dob: '1990-07-14', phone: '09182345678' },
  { id: 'k3', name: 'Ben Aguilar',    idType: 'Passport',               idNum: 'P1234567A',       submitted: '2026-09-04', dob: '1988-11-03', phone: '09183456789' },
  { id: 'k4', name: 'Lea Soriano',    idType: 'SSS ID',                 idNum: '34-5678901-2',    submitted: '2026-09-03', dob: '2000-01-30', phone: '09184567890' },
  { id: 'k5', name: 'Carl Reyes',     idType: 'PRC ID',                 idNum: 'PRC-0123456',     submitted: '2026-09-02', dob: '1992-09-08', phone: '09185678901' },
]

const TABS = [{ id: 'all', label: 'All Providers' }, { id: 'kyc', label: `KYC Queue (${KYC_QUEUE.length})` }]

export default function AdminProviders() {
  const [tab, setTab]         = useState('all')
  const [reviewItem, setReview] = useState(null)
  const [rejectReason, setRR] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [queue, setQueue]     = useState(KYC_QUEUE)

  const approveKYC = id => {
    setQueue(prev => prev.filter(k => k.id !== id))
    toast.success('Provider KYC approved!')
    setReview(null)
  }

  const rejectKYC = () => {
    if (!rejectReason.trim()) return toast.error('Enter rejection reason')
    setQueue(prev => prev.filter(k => k.id !== reviewItem.id))
    toast.error('Provider KYC rejected')
    setReview(null); setShowReject(false); setRR('')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Provider Management</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'all' && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                <th className="p-4 font-medium">Provider</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Listings</th>
                <th className="p-4 font-medium">Rating</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ALL_PROVIDERS.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.business}</div>
                  </td>
                  <td className="p-4 text-gray-500">{p.type}</td>
                  <td className="p-4 text-gray-700">{p.listings}</td>
                  <td className="p-4">{p.rating ? `⭐ ${p.rating}` : '—'}</td>
                  <td className="p-4"><Badge variant={statusVariant(p.status)} className="capitalize">{p.status.replace('_', ' ')}</Badge></td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {p.status === 'approved' && <button onClick={() => toast('Provider suspended')} className="btn-sm bg-amber-100 text-amber-700 rounded-lg px-2 py-1 text-xs font-medium">Suspend</button>}
                      {p.status === 'under_verification' && <button onClick={() => toast('Moved to KYC queue')} className="btn-sm bg-blue-100 text-blue-700 rounded-lg px-2 py-1 text-xs font-medium">Review KYC</button>}
                      <button onClick={() => toast('View details')} className="btn-ghost btn-sm">Details</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'kyc' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queue.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-gray-400">
              <CheckCircle size={48} className="mx-auto mb-3 opacity-30" />
              <p>All KYC submissions reviewed!</p>
            </div>
          ) : queue.map(k => (
            <div key={k.id} className="card flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{k.name}</p>
                  <p className="text-xs text-gray-400">Submitted: {k.submitted}</p>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{k.idType}</span> · {k.idNum}
              </div>
              <button onClick={() => setReview(k)} className="btn-secondary w-full">Review Documents</button>
            </div>
          ))}
        </div>
      )}

      {/* KYC Review Modal */}
      <Modal open={!!reviewItem} onClose={() => setReview(null)} title="KYC Document Review" size="lg">
        {reviewItem && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Full Name', reviewItem.name], ['Date of Birth', reviewItem.dob], ['Phone', reviewItem.phone], ['ID Type', reviewItem.idType], ['ID Number', reviewItem.idNum], ['Submitted', reviewItem.submitted]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">{k}</p>
                  <p className="font-medium text-gray-900">{v}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-100 rounded-xl h-36 flex items-center justify-center text-gray-400 text-sm">
                🪪 ID Photo
              </div>
              <div className="bg-gray-100 rounded-xl h-36 flex items-center justify-center text-gray-400 text-sm">
                🤳 Selfie
              </div>
            </div>

            {showReject ? (
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="label">Rejection Reason</label>
                  <textarea rows={3} value={rejectReason} onChange={e => setRR(e.target.value)} className="input resize-none" placeholder="Explain why the KYC is being rejected..." />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowReject(false)} className="btn-ghost flex-1">Cancel</button>
                  <button onClick={rejectKYC} className="btn-danger flex-1">Confirm Reject</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => approveKYC(reviewItem.id)} className="btn-primary flex-1 gap-1" style={{ background: '#059669' }}>
                  <CheckCircle size={15} /> Approve
                </button>
                <button onClick={() => setShowReject(true)} className="btn-danger flex-1 gap-1">
                  <XCircle size={15} /> Reject
                </button>
                <button onClick={() => { toast('Correction request sent'); setReview(null) }} className="btn-secondary flex-1 gap-1">
                  <AlertCircle size={15} /> Request Correction
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

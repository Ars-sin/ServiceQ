import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import {
  Users, Briefcase, Package, CalendarCheck, DollarSign,
  TrendingUp, ArrowDownCircle, Download, FileText
} from "lucide-react"
import { formatPHP, relativeTime, statusVariant, cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

// ── Mock KPI Data ────────────────────────────────────────────────────────
const KPI = {
  totalUsers: 4_821,
  totalProviders: 638,
  totalListings: 1_204,
  totalBookings: 9_347,
  gtv: 4_823_650,
  platformRevenue: 482_365,
  providerPayouts: 3_984_120,
}

// ── Mock Recent Activity ─────────────────────────────────────────────────
const ACTIVITY = [
  { id: 1, type: "New User",     details: "Ana Reyes registered from Quezon City",               time: "2026-09-07T07:55:00Z", status: "active" },
  { id: 2, type: "New Booking",  details: "SQ-AB123 — Aircon Cleaning in Makati",                time: "2026-09-07T07:40:00Z", status: "pending" },
  { id: 3, type: "KYC Submitted",details: "Dante Plumbing Services submitted ID documents",      time: "2026-09-07T07:20:00Z", status: "under_verification" },
  { id: 4, type: "Withdrawal",   details: "CebuTech Rentals requested ₱8,500 payout",            time: "2026-09-07T07:00:00Z", status: "pending" },
  { id: 5, type: "New User",     details: "Rolando Mercado registered from Cebu City",           time: "2026-09-07T06:45:00Z", status: "active" },
  { id: 6, type: "New Booking",  details: "SQ-CD456 — Honda Click Daily Rental in BGC",          time: "2026-09-07T06:30:00Z", status: "scheduled" },
  { id: 7, type: "KYC Submitted","details": "Sunshine Events Rentals submitted Passport",        time: "2026-09-07T06:10:00Z", status: "under_verification" },
  { id: 8, type: "Withdrawal",   details: "Manila Movers Co. requested ₱12,000 payout via BPI", time: "2026-09-07T05:50:00Z", status: "pending" },
]

const TYPE_BADGE = {
  "New User":      "bg-blue-100 text-blue-800",
  "New Booking":   "bg-green-100 text-green-800",
  "KYC Submitted": "bg-yellow-100 text-yellow-800",
  "Withdrawal":    "bg-purple-100 text-purple-800",
}

const STATUS_BADGE = {
  active:              "bg-green-100 text-green-800",
  pending:             "bg-yellow-100 text-yellow-800",
  scheduled:           "bg-blue-100 text-blue-800",
  under_verification:  "bg-orange-100 text-orange-800",
}

const PERIODS = ["Daily", "Weekly", "Monthly", "Yearly"]

const STAT_CARDS = [
  { label: "Total Users",       value: KPI.totalUsers.toLocaleString(),    Icon: Users,           color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100" },
  { label: "Total Providers",   value: KPI.totalProviders.toLocaleString(),Icon: Briefcase,       color: "text-green-600",  bg: "bg-green-50",  border: "border-green-100" },
  { label: "Total Listings",    value: KPI.totalListings.toLocaleString(), Icon: Package,         color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  { label: "Total Bookings",    value: KPI.totalBookings.toLocaleString(), Icon: CalendarCheck,   color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { label: "Gross Trans. Value",value: formatPHP(KPI.gtv),                 Icon: DollarSign,      color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100" },
  { label: "Platform Revenue",  value: formatPHP(KPI.platformRevenue),     Icon: TrendingUp,      color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  { label: "Provider Payouts",  value: formatPHP(KPI.providerPayouts),     Icon: ArrowDownCircle, color: "text-gray-600",   bg: "bg-gray-50",   border: "border-gray-200" },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState("Monthly")
  const [liveStats, setLiveStats] = useState({
    users: null,
    providers: null,
    kycPending: null,
  })

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: profs } = await supabase.from('profiles').select('id, role, avatar_url, is_active')
        if (profs) {
          const uCount = profs.length
          const pList = profs.filter(p => p.role === 'provider')
          const pCount = pList.length
          const pendingKYC = pList.filter(p => {
            let meta = null
            try {
              if (p.avatar_url && p.avatar_url.startsWith('{')) meta = JSON.parse(p.avatar_url)
            } catch {}
            const localApproved = localStorage.getItem(`provider_verified_${p.id}`) === 'true'
            if (localApproved) return false
            return meta?.status === 'under_verification' || (!meta?.status && p.is_active !== false)
          }).length

          setLiveStats({
            users: uCount,
            providers: pCount,
            kycPending: pendingKYC,
          })
        }
      } catch (e) {
        console.error('Error fetching admin dashboard stats:', e)
      }
    }
    loadStats()
  }, [])

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-6 space-y-8"
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <button
          onClick={() => toast.success("Export started")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Download size={15} /> Export Report
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, Icon, color, bg, border }) => {
          let displayVal = value
          if (label === "Total Users" && liveStats.users !== null) displayVal = liveStats.users.toLocaleString()
          if (label === "Total Providers" && liveStats.providers !== null) displayVal = liveStats.providers.toLocaleString()
          return (
            <div key={label} className={cn("rounded-xl border p-4 flex items-center gap-4", bg, border)}>
              <div className={cn("p-2 rounded-lg bg-white/70", color)}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900">{displayVal}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Analytics Section ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition",
                  period === p ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => toast.success("CSV export started")}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
          >
            <FileText size={14} /> Export CSV
          </button>
        </div>
        {/* Chart placeholder */}
        <div className="h-64 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 text-sm font-medium">Revenue Chart — Connect analytics library</p>
        </div>
      </div>

      {/* ── Bottom Grid: Activity + Pending Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Type", "Details", "Time", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ACTIVITY.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", TYPE_BADGE[a.type])}>
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs max-w-xs">{a.details}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{relativeTime(a.time)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize",
                        STATUS_BADGE[a.status] ?? "bg-gray-100 text-gray-700"
                      )}>
                        {a.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Pending Actions</h2>
          {[
            { label: "KYC Verification Queue", count: liveStats.kycPending !== null ? liveStats.kycPending : 3, action: "Review",   path: "/admin/providers", color: "bg-yellow-50 border-yellow-200", btn: "bg-yellow-500 hover:bg-yellow-600" },
            { label: "Withdrawal Requests",     count: 8,  action: "Process",  path: "/admin/financials", color: "bg-blue-50 border-blue-200",    btn: "bg-blue-600 hover:bg-blue-700" },
            { label: "Listing Reports",          count: 5,  action: "Moderate", path: "/admin/listings",   color: "bg-red-50 border-red-200",      btn: "bg-red-600 hover:bg-red-700" },
          ].map(({ label, count, action, path, color, btn }) => (
            <div key={label} className={cn("border rounded-xl p-4 space-y-3", color)}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <button
                onClick={() => navigate(path)}
                className={cn("w-full py-2 text-sm font-medium text-white rounded-lg transition", btn)}
              >
                {action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

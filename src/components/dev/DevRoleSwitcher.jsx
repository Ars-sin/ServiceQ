import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants'
import { User, Briefcase, Shield } from 'lucide-react'

const ROLE_OPTIONS = [
  { role: ROLES.CUSTOMER, label: 'Customer', icon: User,      color: 'bg-brand-600' },
  { role: ROLES.PROVIDER, label: 'Provider', icon: Briefcase, color: 'bg-emerald-600' },
  { role: ROLES.ADMIN,    label: 'Admin',    icon: Shield,    color: 'bg-rose-600' },
]

export default function DevRoleSwitcher() {
  const { devRole, switchRole } = useAuth()

  if (import.meta.env.PROD) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      <div className="bg-gray-900 text-gray-400 text-[10px] font-mono px-2 py-1 rounded-lg">
        DEV PORTAL SWITCHER
      </div>
      <div className="flex gap-1.5">
        {ROLE_OPTIONS.map(({ role, label, icon: Icon, color }) => (
          <button
            key={role}
            onClick={() => switchRole(role)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${
              devRole === role
                ? `${color} shadow-lg scale-105`
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

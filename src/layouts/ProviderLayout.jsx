import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Package, CalendarCheck, DollarSign,
  Zap, User, LogOut, Bell, Menu,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/provider/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/provider/listings',     label: 'My Listings',  icon: Package },
  { to: '/provider/bookings',     label: 'Bookings',     icon: CalendarCheck },
  { to: '/provider/earnings',     label: 'Earnings',     icon: DollarSign },
  { to: '/provider/subscription', label: 'Subscription', icon: Zap },
  { to: '/provider/profile',      label: 'Profile',      icon: User },
]

export default function ProviderLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300',
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <img src="/logoword(black).png" alt="ServiceQ" className="h-10 w-auto object-contain" />
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Provider</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn('sidebar-link', isActive && 'sidebar-link-active')
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => { signOut(); navigate('/login') }}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell size={20} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

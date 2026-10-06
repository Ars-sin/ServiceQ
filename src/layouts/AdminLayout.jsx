import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Users, Briefcase, Package, CalendarCheck,
  DollarSign, Shield, Settings, ScrollText, LogOut, Bell, Menu, User,
  ChevronsUpDown,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/admin/users',      label: 'Users',        icon: Users },
  { to: '/admin/providers',  label: 'Providers',    icon: Briefcase },
  { to: '/admin/listings',   label: 'Listings',     icon: Package },
  { to: '/admin/bookings',   label: 'Bookings',     icon: CalendarCheck },
  { to: '/admin/financials', label: 'Financials',   icon: DollarSign },
  { to: '/admin/staff',      label: 'Staff & Roles',icon: Shield },
  { to: '/admin/audit-log',  label: 'Audit Log',    icon: ScrollText },
]

export default function AdminLayout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  const adminName = profile?.full_name || user?.user_metadata?.full_name || 'Bryce'
  const adminEmail = user?.email || profile?.email || 'rutilander@gmail.com'

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300',
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ServiceQ" className="h-8 w-auto object-contain" />
            <span className="font-bold text-lg text-gray-900 tracking-tight">ServiceQ</span>
          </div>
          <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
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

        {/* User Profile Pill & Dropdown (SQI-27 matching sqi27_expected.png) */}
        <div className="p-3 border-t border-gray-100 relative" ref={userMenuRef}>
          {/* Dropdown Popover */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-2xl border border-gray-200/90 shadow-xl overflow-hidden z-50">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  setMobileOpen(false)
                  navigate('/admin/profile')
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-slate-800 hover:bg-gray-50 transition-colors text-left"
              >
                <User size={19} className="text-slate-800" strokeWidth={1.8} />
                <span className="text-sm font-medium text-slate-900">Profile</span>
              </button>

              <div className="h-px bg-gray-200 w-full" />

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  setMobileOpen(false)
                  navigate('/admin/settings')
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-slate-800 hover:bg-gray-50 transition-colors text-left"
              >
                <Settings size={19} className="text-slate-800" strokeWidth={1.8} />
                <span className="text-sm font-medium text-slate-900">Settings</span>
              </button>

              <div className="h-px bg-gray-200 w-full" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-3 text-slate-800 hover:bg-gray-50 transition-colors text-left"
              >
                <LogOut size={19} className="text-slate-800" strokeWidth={1.8} />
                <span className="text-sm font-medium text-slate-900">Sign out</span>
              </button>
            </div>
          )}

          {/* User Pill Button */}
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/60 shadow-xs transition-all text-left group"
          >
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-sm font-bold text-slate-900 truncate leading-snug">
                {adminName}
              </p>
              <p className="text-xs text-slate-600 truncate leading-snug">
                {adminEmail}
              </p>
            </div>
            <ChevronsUpDown
              size={18}
              className="text-slate-700 flex-shrink-0 group-hover:text-slate-900 transition-colors"
            />
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
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <NavLink
              to="/admin/profile"
              className="flex items-center gap-2 py-1.5 px-3 rounded-xl border border-gray-200/80 bg-gray-50 hover:bg-gray-100 transition-all text-xs font-semibold text-gray-800"
            >
              <span>{adminName}</span>
            </NavLink>
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

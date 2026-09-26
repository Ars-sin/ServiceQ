import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Compass, Heart, CalendarCheck,
  User, LogOut, Bell, Menu, X, Wrench,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/customer/explore',   label: 'Explore',   icon: Compass },
  { to: '/customer/bookings',  label: 'Bookings',  icon: CalendarCheck },
  { to: '/customer/favorites', label: 'Favorites', icon: Heart },
  { to: '/customer/profile',   label: 'Profile',   icon: User },
]

const MOCK_NOTIFS = [
  { id: 1, text: 'Your booking SQ-A1B2C has been confirmed.',  time: '2 hrs ago',  read: false },
  { id: 2, text: 'Maria Santos accepted your cleaning request.', time: '5 hrs ago', read: false },
  { id: 3, text: 'Reminder: Service scheduled for tomorrow.',  time: '1 day ago',  read: true  },
]

export default function CustomerLayout() {
  const { signOut, profile, role } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState(MOCK_NOTIFS)
  const notifRef = useRef(null)

  // A3: Block suspended users
  useEffect(() => {
    if (profile && profile.status === 'suspended') {
      toast.error('Your account has been suspended. Please contact support.')
      signOut()
      navigate('/login', { replace: true })
    }
  }, [profile])

  // U2: Maintenance mode — redirect non-admins
  useEffect(() => {
    const maintenance = localStorage.getItem('serviceq_maintenance_mode') === 'true'
    if (maintenance && role !== 'admin') {
      navigate('/maintenance', { replace: true })
    }
  }, [role])

  // Close notif dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = notifs.filter(n => !n.read).length

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300',
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ServiceQ" className="h-9 w-auto object-contain" />
            <span className="font-bold text-xl text-gray-900">ServiceQ</span>
          </div>
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
          <div className="flex items-center gap-2" ref={notifRef}>
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} className="text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-bold text-gray-900 text-sm">Notifications</span>
                    <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline font-medium">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifs.map(n => (
                      <div
                        key={n.id}
                        onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-brand-50/40' : ''}`}
                      >
                        <p className={`text-xs leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {!n.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500 mr-1.5 mb-0.5" />}
                          {n.text}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                    <button onClick={() => setShowNotifs(false)} className="text-xs text-gray-400 hover:text-gray-600">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
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

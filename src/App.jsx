import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Auth pages
import LoginPage          from '@/pages/auth/LoginPage'
import RegisterPage       from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'

// Customer portal
import CustomerLayout       from '@/layouts/CustomerLayout'
import CustomerExplore      from '@/pages/customer/Explore'
import CustomerDashboard    from '@/pages/customer/Dashboard'
import CustomerListings     from '@/pages/customer/Listings'
import CustomerListingDetail from '@/pages/customer/ListingDetail'
import CustomerCheckout     from '@/pages/customer/Checkout'
import CustomerBookings     from '@/pages/customer/Bookings'
import CustomerProfile      from '@/pages/customer/Profile'
import CustomerFavorites    from '@/pages/customer/Favorites'

// Provider portal
import ProviderOnboarding  from '@/pages/provider/Onboarding'
import ProviderLayout      from '@/layouts/ProviderLayout'
import ProviderDashboard   from '@/pages/provider/Dashboard'
import ProviderListings    from '@/pages/provider/Listings'
import ProviderBookings    from '@/pages/provider/Bookings'
import ProviderEarnings    from '@/pages/provider/Earnings'
import ProviderSubscription from '@/pages/provider/Subscription'
import ProviderProfile     from '@/pages/provider/Profile'

// Admin portal
import AdminLayout     from '@/layouts/AdminLayout'
import AdminDashboard  from '@/pages/admin/Dashboard'
import AdminUsers      from '@/pages/admin/Users'
import AdminProviders  from '@/pages/admin/Providers'
import AdminListings   from '@/pages/admin/Listings'
import AdminBookings   from '@/pages/admin/Bookings'
import AdminFinancials from '@/pages/admin/Financials'
import AdminStaff      from '@/pages/admin/Staff'
import AdminSettings   from '@/pages/admin/Settings'
import AdminAuditLog   from '@/pages/admin/AuditLog'

// Misc
import NotFoundPage from '@/pages/NotFound'
import LandingPage  from '@/pages/Landing'

// ─────────────────────────────────────────────────────────────
//  Route Guards
// ─────────────────────────────────────────────────────────────

/**
 * Requires user to be logged in.
 * If not logged in → redirect to /login
 * If logged in but wrong role → redirect to their correct portal
 */
function ProtectedRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth()

  if (loading) return <SplashScreen />

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />

  // Logged in but wrong portal → redirect to correct one
  if (requiredRole && role && role !== requiredRole) {
    const redirectMap = {
      customer: '/customer/dashboard',
      provider: '/provider/dashboard',
      admin:    '/admin/dashboard',
    }
    return <Navigate to={redirectMap[role] ?? '/login'} replace />
  }

  return children
}

/**
 * If already logged in, redirect away from auth pages
 * to the correct portal based on role
 */
function GuestOnly({ children }) {
  const { user, role, loading } = useAuth()

  if (loading) return <SplashScreen />

  if (user && role) {
    const redirectMap = {
      customer: '/customer/dashboard',
      provider: '/provider/dashboard',
      admin:    '/admin/dashboard',
    }
    return <Navigate to={redirectMap[role] ?? '/'} replace />
  }

  return children
}

// ─────────────────────────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────────────────────────

function AppRoutes() {
  const { loading } = useAuth()
  if (loading) return <SplashScreen />

  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<LandingPage />} />

      {/* ── Auth (guests only — redirect if already logged in) ── */}
      <Route path="/login"           element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/register"        element={<GuestOnly><RegisterPage /></GuestOnly>} />
      <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />

      {/* ── Provider Onboarding (requires login) ── */}
      <Route path="/provider/onboarding"
        element={
          <ProtectedRoute requiredRole="provider">
            <ProviderOnboarding />
          </ProtectedRoute>
        }
      />

      {/* ── Customer Portal ── */}
      <Route path="/customer"
        element={
          <ProtectedRoute requiredRole="customer">
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index               element={<Navigate to="explore" replace />} />
        <Route path="explore"      element={<CustomerExplore />} />
        <Route path="dashboard"    element={<Navigate to="/customer/explore" replace />} />
        <Route path="listings"     element={<Navigate to="/customer/explore" replace />} />
        <Route path="listings/:id" element={<CustomerListingDetail />} />
        <Route path="checkout/:id" element={<CustomerCheckout />} />
        <Route path="bookings"     element={<CustomerBookings />} />
        <Route path="favorites"    element={<CustomerFavorites />} />
        <Route path="profile"      element={<CustomerProfile />} />
      </Route>

      {/* ── Provider Portal ── */}
      <Route path="/provider"
        element={
          <ProtectedRoute requiredRole="provider">
            <ProviderLayout />
          </ProtectedRoute>
        }
      >
        <Route index               element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"    element={<ProviderDashboard />} />
        <Route path="listings"     element={<ProviderListings />} />
        <Route path="bookings"     element={<ProviderBookings />} />
        <Route path="earnings"     element={<ProviderEarnings />} />
        <Route path="subscription" element={<ProviderSubscription />} />
        <Route path="profile"      element={<ProviderProfile />} />
      </Route>

      {/* ── Admin Portal ── */}
      <Route path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index             element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<AdminDashboard />} />
        <Route path="users"      element={<AdminUsers />} />
        <Route path="providers"  element={<AdminProviders />} />
        <Route path="listings"   element={<AdminListings />} />
        <Route path="bookings"   element={<AdminBookings />} />
        <Route path="financials" element={<AdminFinancials />} />
        <Route path="staff"      element={<AdminStaff />} />
        <Route path="settings"   element={<AdminSettings />} />
        <Route path="audit-log"  element={<AdminAuditLog />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

// ─────────────────────────────────────────────────────────────
//  Splash / Loading screen
// ─────────────────────────────────────────────────────────────

function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.png" alt="ServiceQ" className="w-16 h-16 object-contain animate-pulse" />
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Root
// ─────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

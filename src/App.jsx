import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants'

// Dev role switcher overlay
import DevRoleSwitcher from '@/components/dev/DevRoleSwitcher'

// Auth pages
import LoginPage         from '@/pages/auth/LoginPage'
import RegisterPage      from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'

// Customer portal
import CustomerLayout    from '@/layouts/CustomerLayout'
import CustomerDashboard from '@/pages/customer/Dashboard'
import CustomerListings  from '@/pages/customer/Listings'
import CustomerListingDetail from '@/pages/customer/ListingDetail'
import CustomerCheckout  from '@/pages/customer/Checkout'
import CustomerBookings  from '@/pages/customer/Bookings'
import CustomerProfile   from '@/pages/customer/Profile'
import CustomerFavorites from '@/pages/customer/Favorites'

// Provider portal
import ProviderOnboarding from '@/pages/provider/Onboarding'
import ProviderLayout     from '@/layouts/ProviderLayout'
import ProviderDashboard  from '@/pages/provider/Dashboard'
import ProviderListings   from '@/pages/provider/Listings'
import ProviderBookings   from '@/pages/provider/Bookings'
import ProviderEarnings   from '@/pages/provider/Earnings'
import ProviderSubscription from '@/pages/provider/Subscription'
import ProviderProfile    from '@/pages/provider/Profile'

// Admin portal
import AdminLayout        from '@/layouts/AdminLayout'
import AdminDashboard     from '@/pages/admin/Dashboard'
import AdminUsers         from '@/pages/admin/Users'
import AdminProviders     from '@/pages/admin/Providers'
import AdminListings      from '@/pages/admin/Listings'
import AdminBookings      from '@/pages/admin/Bookings'
import AdminFinancials    from '@/pages/admin/Financials'
import AdminStaff         from '@/pages/admin/Staff'
import AdminSettings      from '@/pages/admin/Settings'
import AdminAuditLog      from '@/pages/admin/AuditLog'

// Misc
import NotFoundPage       from '@/pages/NotFound'
import LandingPage        from '@/pages/Landing'

function AppRoutes() {
  const { role, loading } = useAuth()

  if (loading) return <SplashScreen />

  return (
    <>
      <DevRoleSwitcher />
      <Routes>
        {/* Public */}
        <Route path="/"                  element={<LandingPage />} />
        <Route path="/login"             element={<LoginPage />} />
        <Route path="/register"          element={<RegisterPage />} />
        <Route path="/forgot-password"   element={<ForgotPasswordPage />} />

        {/* Provider onboarding (before dashboard) */}
        <Route path="/provider/onboarding" element={<ProviderOnboarding />} />

        {/* ── Customer Portal ── */}
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index               element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<CustomerDashboard />} />
          <Route path="listings"     element={<CustomerListings />} />
          <Route path="listings/:id" element={<CustomerListingDetail />} />
          <Route path="checkout/:id" element={<CustomerCheckout />} />
          <Route path="bookings"     element={<CustomerBookings />} />
          <Route path="favorites"    element={<CustomerFavorites />} />
          <Route path="profile"      element={<CustomerProfile />} />
        </Route>

        {/* ── Provider Portal ── */}
        <Route path="/provider" element={<ProviderLayout />}>
          <Route index                  element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"       element={<ProviderDashboard />} />
          <Route path="listings"        element={<ProviderListings />} />
          <Route path="bookings"        element={<ProviderBookings />} />
          <Route path="earnings"        element={<ProviderEarnings />} />
          <Route path="subscription"    element={<ProviderSubscription />} />
          <Route path="profile"         element={<ProviderProfile />} />
        </Route>

        {/* ── Admin Portal ── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index               element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<AdminDashboard />} />
          <Route path="users"        element={<AdminUsers />} />
          <Route path="providers"    element={<AdminProviders />} />
          <Route path="listings"     element={<AdminListings />} />
          <Route path="bookings"     element={<AdminBookings />} />
          <Route path="financials"   element={<AdminFinancials />} />
          <Route path="staff"        element={<AdminStaff />} />
          <Route path="settings"     element={<AdminSettings />} />
          <Route path="audit-log"    element={<AdminAuditLog />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center">
          <span className="text-white font-black text-xl">S</span>
        </div>
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

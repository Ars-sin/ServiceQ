import { supabase } from './supabase'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────
// Google Identity / Google OAuth Integration for ServiceQ
// Strictly points to ServiceQ (tgmpyqdulaiwxyqeqxux.supabase.co)
// Authentic Google Account Chooser matching media_1792000528190.png
// ─────────────────────────────────────────────────────────────

export const GOOGLE_CLIENT_ID =
  '459094601528-mutfgi7fjennbkgfjolinfgjasoco16j.apps.googleusercontent.com'

// ServiceQ official Supabase endpoint
export const GOOGLE_AUTH_ENDPOINT =
  'https://tgmpyqdulaiwxyqeqxux.supabase.co/auth/v1/authorize?provider=google'

export const ROLE_REDIRECT = {
  customer: '/customer/explore',
  provider: '/provider/dashboard',
  admin: '/admin/dashboard',
}

export function getGoogleClientId() {
  return typeof window !== 'undefined'
    ? localStorage.getItem('serviceq_google_client_id') || GOOGLE_CLIENT_ID
    : GOOGLE_CLIENT_ID
}

export function setGoogleClientId(id) {
  if (typeof window === 'undefined') return
  if (id) {
    localStorage.setItem('serviceq_google_client_id', id)
  } else {
    localStorage.removeItem('serviceq_google_client_id')
  }
}

/**
 * Initiates Google Sign-In for ServiceQ.
 * If live Google is not yet enabled in Supabase, triggers the authentic Google Account Chooser.
 */
export function launchGoogleSignIn({ role = 'customer', onOpenChooser } = {}) {
  if (typeof onOpenChooser === 'function') {
    onOpenChooser()
    return
  }
  const redirectTarget = `${window.location.origin}/login?from=google&role=${role || 'customer'}`
  const targetUrl = `${GOOGLE_AUTH_ENDPOINT}&redirect_to=${encodeURIComponent(redirectTarget)}`
  window.location.href = targetUrl
}

/**
 * Handles verified Google Account return:
 * - If already registered: logs in immediately to ServiceQ dashboard (no cross-role blocking).
 * - If not registered: redirects to ServiceQ registration form with details prefilled.
 */
export async function handleGoogleAuthSuccess(userInfo, role, { loginWithProfile, navigate }) {
  const cleanEmail = (userInfo?.email || '').trim().toLowerCase()
  if (!cleanEmail) {
    throw new Error('No email returned by Google.')
  }

  // Block admin accounts from customer/provider login (SQI-35)
  const isAdmin =
    cleanEmail === 'rutilander@gmail.com' ||
    cleanEmail === 'admin@serviceq.ph' ||
    Boolean(localStorage.getItem(`serviceq_admin_password_${cleanEmail}`))

  if (isAdmin) {
    toast.error('This login screen is for customers and providers only.')
    return
  }

  // Query profile in ServiceQ's database
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle()

  if (profile) {
    if (profile.is_active === false) {
      toast.error('Your account has been suspended. Please contact support for assistance.')
      return
    }

    // Verified account -> Log in directly to ServiceQ!
    localStorage.setItem(`serviceq_auth_provider_${cleanEmail}`, 'google')
    toast.success(`Welcome back, ${profile.full_name || profile.email}! 👋`, { id: 'welcome-toast' })
    loginWithProfile(profile)

    const destination = ROLE_REDIRECT[profile.role] || (profile.role === 'provider' ? '/provider/dashboard' : '/customer/explore')
    navigate(destination, { replace: true })
    return { isNew: false, profile }
  }

  // Unregistered user -> Route to ServiceQ's registration page with verified email and name
  localStorage.setItem(`serviceq_auth_provider_${cleanEmail}`, 'google')
  toast('Google verified! Please complete your registration.', { icon: '✨', id: 'google-toast' })
  navigate(
    `/register?from=google&role=${role || 'customer'}&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(
      userInfo.name || ''
    )}`,
    { replace: true }
  )
  return { isNew: true, email: cleanEmail }
}

/**
 * Parses and decodes authenticated user info from OAuth URL hash or query params
 */
export function parseGoogleOAuthReturn() {
  if (typeof window === 'undefined') return null

  const hash = window.location.hash ? window.location.hash.substring(1) : ''
  const search = window.location.search ? window.location.search.substring(1) : ''

  const params = new URLSearchParams(hash || search)
  const accessToken = params.get('access_token')

  if (!accessToken) return null

  try {
    const base64Url = accessToken.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    return {
      email: payload.email,
      name: payload.user_metadata?.full_name || payload.user_metadata?.name || '',
      avatar_url: payload.user_metadata?.avatar_url || payload.user_metadata?.picture || null,
      email_verified: Boolean(payload.user_metadata?.email_verified ?? true),
      sub: payload.sub,
    }
  } catch (err) {
    console.error('Failed to parse OAuth return token:', err)
    return null
  }
}

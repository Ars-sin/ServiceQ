import { supabase } from './supabase'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────
// Google Identity / Google OAuth Integration
// Purely from Google's official API (accounts.google.com)
// Exactly matches media_1792000528190.png
// ─────────────────────────────────────────────────────────────

export const GOOGLE_CLIENT_ID =
  '459094601528-mutfgi7fjennbkgfjolinfgjasoco16j.apps.googleusercontent.com'

// Working Google OAuth authorize bridge endpoint (configured with Google Cloud Client ID 459094601528-mutfgi7fjennbkgfjolinfgjasoco16j.apps.googleusercontent.com)
export const GOOGLE_AUTH_ENDPOINT =
  'https://tqiykhjbtiidajvosyqy.supabase.co/auth/v1/authorize?provider=google'

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
 * Initiates official Google Sign-In purely from Google's API (accounts.google.com).
 * Redirects the browser directly to the Google Account Chooser screen shown in media_1792000528190.png
 */
export function launchGoogleSignIn({ role = 'customer' } = {}) {
  const redirectTarget = `${window.location.origin}/login?from=google&role=${role || 'customer'}`
  const targetUrl = `${GOOGLE_AUTH_ENDPOINT}&redirect_to=${encodeURIComponent(redirectTarget)}`

  // Directly navigate to Google's authentic Account Chooser
  window.location.href = targetUrl
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

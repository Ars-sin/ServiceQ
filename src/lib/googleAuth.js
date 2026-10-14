import { supabase } from './supabase'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────
// Google Identity Services (GIS) / Google OAuth Integration
// Purely from Google's official API (accounts.google.com)
// ─────────────────────────────────────────────────────────────

/**
 * Get active Google OAuth 2.0 Client ID
 */
export function getGoogleClientId() {
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    localStorage.getItem('serviceq_google_client_id') ||
    ''
  )
}

/**
 * Persist Google Client ID
 */
export function setGoogleClientId(clientId) {
  if (clientId && clientId.trim()) {
    localStorage.setItem('serviceq_google_client_id', clientId.trim())
  } else {
    localStorage.removeItem('serviceq_google_client_id')
  }
}

/**
 * Wait for Google Identity Services script to load from index.html
 */
export function waitForGoogleScript(timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) {
      return resolve(window.google)
    }

    const start = Date.now()
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) {
        clearInterval(interval)
        resolve(window.google)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        reject(new Error('Google Identity Services SDK failed to load. Please check your internet connection.'))
      }
    }, 100)
  })
}

/**
 * Initiates official Google Sign-In purely from Google's API (accounts.google.com).
 * Uses Google Identity Services token client to request access and fetch verified
 * user info directly from Google (https://www.googleapis.com/oauth2/v3/userinfo).
 */
export async function launchGoogleSignIn({ role = 'customer', onSuccess, onError }) {
  const clientId = getGoogleClientId()

  // 1. If Google Client ID is configured, use official Google Identity Services API directly
  if (clientId) {
    try {
      await waitForGoogleScript()

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google OAuth 2.0 API is not available.')
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Google OAuth token error:', tokenResponse)
            const err = new Error(
              tokenResponse.error_description || tokenResponse.error || 'Google Sign-In was cancelled.'
            )
            onError?.(err)
            return
          }

          try {
            // Fetch verified user information directly from Google's official API
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            })
            if (!res.ok) {
              throw new Error(`Failed to fetch Google profile: ${res.statusText}`)
            }
            const userInfo = await res.json()
            onSuccess?.(userInfo)
          } catch (fetchErr) {
            console.error('Error fetching Google userinfo:', fetchErr)
            onError?.(fetchErr)
          }
        },
      })

      // Opens Google's genuine account chooser popup directly from accounts.google.com
      client.requestAccessToken({ prompt: 'select_account' })
      return
    } catch (err) {
      console.warn('Google Identity Services direct launch failed:', err)
      onError?.(err)
      return
    }
  }

  // If no Google Client ID is configured yet, trigger modal without navigating to broken URL
  const err = new Error('GOOGLE_CLIENT_ID_REQUIRED')
  err.isConfigurationMissing = true
  onError?.(err)
}

/**
 * Handle authenticated Google User object { email, name, picture, email_verified }
 */
export async function handleGoogleAuthSuccess(userInfo, role, { loginWithProfile, navigate }) {
  const cleanEmail = (userInfo.email || '').trim().toLowerCase()
  if (!cleanEmail) {
    throw new Error('No email returned by Google.')
  }

  // Check admin
  const isAdmin =
    cleanEmail === 'rutilander@gmail.com' ||
    cleanEmail === 'admin@serviceq.ph' ||
    Boolean(localStorage.getItem(`serviceq_admin_password_${cleanEmail}`))

  if (isAdmin) {
    toast.error('This login screen is for customers and providers only.')
    return
  }

  // Query Supabase for existing profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle()

  if (profile) {
    // Check suspended
    if (profile.is_active === false) {
      toast.error('Your account has been suspended. Please contact support for assistance.')
      return
    }

    // Check role mismatch
    if (role === 'customer' && profile.role === 'provider') {
      toast.error('This is a Provider account. Please use the Provider tab.')
      return
    }
    if (role === 'provider' && profile.role === 'customer') {
      toast.error('This is a Customer account. Please use the Customer tab.')
      return
    }

    // Verified account -> Log in directly!
    localStorage.setItem(`serviceq_auth_provider_${cleanEmail}`, 'google')
    toast.success(`Welcome back, ${profile.full_name || profile.email}! 👋`, { id: 'welcome-toast' })
    loginWithProfile(profile)
    const dest = profile.role === 'provider' ? '/provider/dashboard' : '/customer/explore'
    navigate(dest, { replace: true })
    return { isNew: false, profile }
  }

  // New Google user -> route to register with Google verified details pre-filled
  localStorage.setItem(`serviceq_auth_provider_${cleanEmail}`, 'google')
  toast('Google account connected! Please complete your registration.', { icon: '✨', id: 'google-toast' })
  navigate(
    `/register?from=google&role=${role}&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(
      userInfo.name || ''
    )}`,
    { replace: true }
  )
  return { isNew: true, email: cleanEmail }
}

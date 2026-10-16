import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

// 30 minutes of inactivity before auto-logout (1,800,000 ms)
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000
const INACTIVITY_WARNING_MS = 28 * 60 * 1000 // 2-minute warning

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [devRole, setDevRole] = useState(null)

  const navigate = useNavigate()
  const lastActivityRef = useRef(Date.now())
  const warningShownRef = useRef(false)

  // ── Record user activity (throttled) ──────────────────────────
  const recordActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    warningShownRef.current = false

    // Throttle localStorage writes to at most once every 10 seconds
    const stored = Number(localStorage.getItem('serviceq_last_activity') || '0')
    if (now - stored > 10000) {
      localStorage.setItem('serviceq_last_activity', now.toString())
    }
  }, [])

  // ── Session Inactivity Tracker (Auto-logout after 30 mins) ───
  useEffect(() => {
    if (!user && !profile) return

    // Initialize activity timestamp
    const stored = Number(localStorage.getItem('serviceq_last_activity') || '0')
    const initialTime = stored && Date.now() - stored < INACTIVITY_TIMEOUT_MS ? stored : Date.now()
    lastActivityRef.current = initialTime
    localStorage.setItem('serviceq_last_activity', initialTime.toString())

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    const handleEvent = () => recordActivity()

    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleEvent, { passive: true })
    })

    // Multi-tab sync via storage events
    const handleStorage = (e) => {
      if (e.key === 'serviceq_last_activity' && e.newValue) {
        lastActivityRef.current = Number(e.newValue)
        warningShownRef.current = false
      }
      if (e.key === 'serviceq_auth_profile' && !e.newValue) {
        // Another tab logged out
        setUser(null)
        setProfile(null)
      }
    }
    window.addEventListener('storage', handleStorage)

    // Check inactivity every 10 seconds
    const interval = setInterval(async () => {
      const now = Date.now()
      const lastActive = Math.max(
        lastActivityRef.current,
        Number(localStorage.getItem('serviceq_last_activity') || '0')
      )
      const idleMs = now - lastActive

      // 28 minutes: Gentle warning
      if (idleMs >= INACTIVITY_WARNING_MS && idleMs < INACTIVITY_TIMEOUT_MS) {
        if (!warningShownRef.current) {
          warningShownRef.current = true
          toast('Your session will expire in 2 minutes due to inactivity.', {
            icon: '⏳',
            id: 'session-timeout-warning',
            duration: 9000,
          })
        }
      }

      // 30 minutes: Terminate session
      if (idleMs >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(interval)
        localStorage.removeItem('serviceq_last_activity')
        const currentRole = profile?.role || 'customer'
        await signOut()
        toast.error('Session expired: You have been logged out due to 30 minutes of inactivity.', {
          id: 'session-timeout-expired',
          duration: 6000,
        })
        const redirectDest =
          currentRole === 'admin' || currentRole === 'superadmin' || currentRole === 'staff'
            ? '/admin/login'
            : '/login'
        navigate(redirectDest, { replace: true })
      }
    }, 10000)

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleEvent))
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [user, profile, recordActivity, navigate])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id, session.user.email)
      } else {
        // Check for local stored direct profile (e.g. Google direct login)
        try {
          const cached = localStorage.getItem('serviceq_auth_profile')
          if (cached) {
            const parsed = JSON.parse(cached)
            if (parsed?.id) {
              setUser({
                id: parsed.id,
                email: parsed.email,
                user_metadata: { full_name: parsed.full_name },
              })
              setProfile(parsed)
              setLoading(false)
              return
            }
          }
        } catch {}
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user.email)
        } else {
          // If no supabase session, check if there's a stored direct profile
          const cached = localStorage.getItem('serviceq_auth_profile')
          if (cached) {
            try {
              const parsed = JSON.parse(cached)
              if (parsed?.id) {
                setUser({
                  id: parsed.id,
                  email: parsed.email,
                  user_metadata: { full_name: parsed.full_name },
                })
                setProfile(parsed)
                setLoading(false)
                return
              }
            } catch {}
          }
          setProfile(null)
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId, userEmail) {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      // If not found by ID, try finding by email
      if (!data && userEmail) {
        const emailRes = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', userEmail)
          .maybeSingle()
        if (emailRes.data) data = emailRes.data
      }

      // If still no profile row (e.g. RLS blocked upsert before email confirmation),
      // build a fallback from auth user_metadata + localStorage cache
      if (!data && userId) {
        // Try localStorage customer cache first (written at registration)
        let cached = null
        try {
          const raw = localStorage.getItem(`serviceq_customer_profile_${userId}`)
          if (raw) cached = JSON.parse(raw)
        } catch {}

        // Try auth session user_metadata as last resort
        const { data: sessionData } = await supabase.auth.getSession()
        const meta = sessionData?.session?.user?.user_metadata || {}

        data = {
          id:          userId,
          email:       userEmail || cached?.email || meta.email || '',
          full_name:   cached?.fullName || meta.full_name || meta.name || '',
          phone:       cached?.phone || meta.phone || '',
          role:        cached?.role || meta.role || 'customer',
          address:     cached?.address || meta.address || '',
          barangay:    cached?.barangay || meta.barangay || '',
          city:        cached?.city || meta.city || '',
          province:    cached?.province || meta.province || '',
          postal_code: cached?.postal_code || meta.postal_code || '',
          is_active:   true,
          _isFallback: true, // flag so we can upsert on next save
        }
      }

      if (data) {
        setProfile(data)
        localStorage.setItem('serviceq_auth_profile', JSON.stringify(data))

        // If this was a fallback, try to write the profile row to Supabase in the background
        if (data._isFallback) {
          const { _isFallback, ...profileRow } = data
          supabase.from('profiles').upsert(profileRow, { onConflict: 'id' }).catch(() => {})
        }
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }


  function loginWithProfile(profileData) {
    const virtualUser = {
      id: profileData.id,
      email: profileData.email,
      user_metadata: {
        full_name: profileData.full_name,
      },
    }
    setUser(virtualUser)
    setProfile(profileData)
    localStorage.setItem('serviceq_auth_profile', JSON.stringify(profileData))
    localStorage.setItem('serviceq_last_activity', Date.now().toString())
    lastActivityRef.current = Date.now()
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch {}
    localStorage.removeItem('serviceq_auth_profile')
    localStorage.removeItem('serviceq_last_activity')
    setUser(null)
    setProfile(null)
    setDevRole(null)
  }

  function switchRole(newRole) {
    setDevRole(newRole)
    if (profile) {
      const updated = { ...profile, role: newRole }
      setProfile(updated)
      localStorage.setItem('serviceq_auth_profile', JSON.stringify(updated))
    }
  }

  const role = devRole || profile?.role || null

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      devRole,
      switchRole,
      loading,
      signOut,
      loginWithProfile,
      fetchProfile,
      recordActivity,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

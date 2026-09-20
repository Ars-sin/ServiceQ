import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [devRole, setDevRole] = useState(null)

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

      if (data) {
        setProfile(data)
        localStorage.setItem('serviceq_auth_profile', JSON.stringify(data))
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
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch {}
    localStorage.removeItem('serviceq_auth_profile')
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

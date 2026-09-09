import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ROLES } from '@/lib/constants'

const AuthContext = createContext(null)

/**
 * AuthProvider wraps the entire app.
 * Exposes: user, profile, role, loading, signOut, switchRole (dev helper)
 */
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Dev role-switcher — lets you toggle between portals without real auth
  const [devRole, setDevRole] = useState(() =>
    localStorage.getItem('sq_dev_role') ?? ROLES.CUSTOMER
  )

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    } catch (err) {
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  /** Dev-only: switch portal role without real auth */
  function switchRole(role) {
    setDevRole(role)
    localStorage.setItem('sq_dev_role', role)
  }

  const role = profile?.role ?? devRole

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signOut, switchRole, devRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

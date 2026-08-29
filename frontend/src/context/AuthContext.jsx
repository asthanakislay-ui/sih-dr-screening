import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { login } from '../services/screeningService'

const STORAGE_KEY = 'retina-auth'

const AuthContext = createContext(null)

function readStoredSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.authenticated) return parsed
  } catch (error) {
    // localStorage may be unavailable
  }
  return null
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)
  const [activeRole, setActiveRole] = useState(() => {
    if (typeof window === 'undefined') return 'clinician'
    const stored = window.localStorage.getItem('retina-active-role')
    return stored || session?.role || 'clinician'
  })

  useEffect(() => {
    try {
      if (session) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      // localStorage may be unavailable — ignore
    }
  }, [session])

  useEffect(() => {
    try {
      window.localStorage.setItem('retina-active-role', activeRole)
    } catch (error) {
      // ignore
    }
  }, [activeRole])

  const signIn = useCallback(async ({ email, password, role }) => {
    try {
      const data = await login(email, password)
      const userRole = data.user.role || 'clinician'

      setSession({
        authenticated: true,
        email: data.user.email,
        role: userRole,
        token: data.token,
        signedInAt: new Date().toISOString(),
      })

      // Use the role selected during login if provided, otherwise use DB role
      setActiveRole(role || userRole)
    } catch (error) {
      throw error
    }
  }, [])

  const setRole = useCallback((role) => {
    setActiveRole(role)
  }, [])

  const signOut = useCallback(() => {
    setSession(null)
    window.localStorage.removeItem('retina-active-role')
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session?.authenticated),
      session,
      activeRole,
      signIn,
      signOut,
      setRole,
    }),
    [session, activeRole, signIn, signOut, setRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

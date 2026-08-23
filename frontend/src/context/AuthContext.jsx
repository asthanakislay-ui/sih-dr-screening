import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'retina-auth'
// Demo-only authentication flag. Backend auth is not implemented.
const AuthContext = createContext(null)

function readStoredSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.authenticated) return parsed
  } catch (error) {
    // localStorage may be unavailable — fall back to not authenticated
  }
  return null
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)

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

  const signIn = useCallback(({ email }) => {
    setSession({
      authenticated: true,
      email: email || 'demo@retina.local',
      signedInAt: new Date().toISOString(),
    })
  }, [])

  const signOut = useCallback(() => {
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session?.authenticated),
      session,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
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

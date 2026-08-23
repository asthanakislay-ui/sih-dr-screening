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

  const signIn = useCallback(async ({ email, password }) => {
    try {
      const data = await login(email, password)
      setSession({
        authenticated: true,
        email: data.user.email,
        token: data.token,
        signedInAt: new Date().toISOString(),
      })
    } catch (error) {
      throw error
    }
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

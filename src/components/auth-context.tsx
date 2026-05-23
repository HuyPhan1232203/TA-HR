import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import {
  clearSession,
  clearToken,
  loadSession,
  saveSession,
} from '@/lib/auth-storage'
import type { IAuthSession } from '@/types/AuthType'

interface AuthContextValue {
  session: IAuthSession | null
  signIn: (session: IAuthSession) => void
  signOut: () => void
}

const AuthCtx = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<IAuthSession | null>(() => loadSession())

  const signIn = useCallback((next: IAuthSession) => {
    saveSession(next)
    setSession(next)
  }, [])

  const signOut = useCallback(() => {
    clearToken()
    clearSession()
    setSession(null)
  }, [])

  return (
    <AuthCtx.Provider value={{ session, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

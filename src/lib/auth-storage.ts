const STORAGE_KEY = 'hr.auth'

export interface AuthSession {
  accessToken: string
  accountId?: string
  username?: string
  fullName?: string
  displayName?: string
  employeeId?: string
  roles?: string[]
  permissions?: string[]
}

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

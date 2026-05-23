import Cookies from 'js-cookie'
import type { IAuthSession } from '@/types/AuthType'

const STORAGE_KEY = 'hr.auth'
const TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY

export function setToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7,
    secure: location.protocol === 'https:',
    sameSite: 'strict',
  })
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}

export function clearToken(): void {
  Cookies.remove(TOKEN_KEY)
}

export function loadSession(): IAuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as IAuthSession
  } catch {
    return null
  }
}

export function saveSession(session: IAuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

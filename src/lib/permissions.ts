import type { AuthSession } from './auth-storage'

export function hasPermission(
  session: AuthSession | null,
  perm: string,
): boolean {
  if (!session) return false
  if (session.roles?.includes('admin')) return true
  return session.permissions?.includes(perm) ?? false
}

export function hasAnyPermission(
  session: AuthSession | null,
  perms: string[],
): boolean {
  return perms.some((p) => hasPermission(session, p))
}

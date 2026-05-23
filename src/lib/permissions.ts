import type { IAuthSession } from '@/types/AuthType'

export function hasPermission(
  session: IAuthSession | null,
  perm: string,
): boolean {
  if (!session) return false
  if (session.roles?.includes('admin')) return true
  return session.permissions?.includes(perm) ?? false
}

export function hasAnyPermission(
  session: IAuthSession | null,
  perms: string[],
): boolean {
  return perms.some((p) => hasPermission(session, p))
}

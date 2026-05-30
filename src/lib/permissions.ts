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

export interface RouteAccess {
  perms?: string[]
  roles?: string[]
}

export function hasAnyRole(
  session: IAuthSession | null,
  roles: string[],
): boolean {
  return roles.some((r) => session?.roles?.includes(r) ?? false)
}

export function canAccess(
  session: IAuthSession | null,
  access?: RouteAccess,
): boolean {
  if (!access) return true
  if (session?.roles?.includes('admin')) return true
  if (access.perms && hasAnyPermission(session, access.perms)) return true
  if (access.roles && hasAnyRole(session, access.roles)) return true
  return false
}

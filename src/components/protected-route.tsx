import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './auth-context'
import { canAccess, type RouteAccess } from '../lib/permissions'
import { Empty } from './ui/empty'
import { ShieldAlert } from 'lucide-react'

export interface ProtectedRouteProps {
  children: ReactNode
  access?: RouteAccess
}

export function ProtectedRoute({ children, access }: ProtectedRouteProps) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (access && !canAccess(session, access)) {
    const needed = [...(access.perms ?? []), ...(access.roles ?? [])]
    return (
      <Empty
        icon={ShieldAlert}
        title="Không có quyền truy cập"
        desc={`Cần một trong các quyền: ${needed.join(', ')}`}
      />
    )
  }

  return <>{children}</>
}

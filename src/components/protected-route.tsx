import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './auth-context'
import { hasAnyPermission } from '../lib/permissions'
import { Empty } from './ui/empty'
import { ShieldAlert } from 'lucide-react'

export interface ProtectedRouteProps {
  children: ReactNode
  perms?: string[]
}

export function ProtectedRoute({ children, perms }: ProtectedRouteProps) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (perms && perms.length > 0 && !hasAnyPermission(session, perms)) {
    return (
      <Empty
        icon={ShieldAlert}
        title="Không có quyền truy cập"
        desc={`Cần một trong các quyền: ${perms.join(', ')}`}
      />
    )
  }

  return <>{children}</>
}

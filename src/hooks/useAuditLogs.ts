import { useQuery } from '@tanstack/react-query'
import { auditLogApi } from '@/api/auditLog.api'
import type { IAuditLog } from '@/types/AuditLogType'

export function useAuditLogs() {
  return useQuery<IAuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await auditLogApi.getAuditLogs()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

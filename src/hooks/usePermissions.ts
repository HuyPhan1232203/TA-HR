import { useQuery } from '@tanstack/react-query'
import { permissionApi } from '@/api/permission.api'
import type { IPermission } from '@/types/PermissionType'

export function usePermissions() {
  return useQuery<IPermission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await permissionApi.getPermissions()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

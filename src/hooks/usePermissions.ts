import { useQuery } from '@tanstack/react-query'
import { permissionApi } from '@/api/permission.api'
import type { IPermissionGroup } from '@/types/PermissionType'

export function usePermissionGroups() {
  return useQuery<IPermissionGroup[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await permissionApi.getPermissions()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

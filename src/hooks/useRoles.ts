import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { roleApi } from '@/api/role.api'
import type { ICreateRole, IRole, IUpdateRole } from '@/types/RoleType'

const KEY = ['roles'] as const

export function useRoles() {
  return useQuery<IRole[]>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await roleApi.getRoles()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateRole) => roleApi.createRole(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; data: IUpdateRole }) =>
      roleApi.updateRole(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

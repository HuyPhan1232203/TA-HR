import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { departmentApi } from '@/api/department.api'
import type {
  ICreateDepartment,
  IDepartment,
  IUpdateDepartment,
} from '@/types/DepartmentType'

const KEY = ['departments'] as const

export function useDepartments() {
  return useQuery<IDepartment[]>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await departmentApi.getDepartments()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateDepartment) =>
      departmentApi.createDepartment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; data: IUpdateDepartment }) =>
      departmentApi.updateDepartment(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => departmentApi.deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

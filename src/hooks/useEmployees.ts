import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeeApi } from '@/api/employee.api'
import type {
  ICreateEmployee,
  ICreateEmployeeAccount,
  IEmployee,
  IUpdateEmployee,
} from '@/types/EmployeeType'

const KEY = ['employees'] as const

export function useEmployees() {
  return useQuery<IEmployee[]>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await employeeApi.getEmployees()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateEmployee) => employeeApi.createEmployee(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; data: IUpdateEmployee }) =>
      employeeApi.updateEmployee(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useCreateEmployeeAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { employeeId: string; data: ICreateEmployeeAccount }) =>
      employeeApi.createAccount(vars.employeeId, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

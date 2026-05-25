import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeeSalaryRateApi } from '@/api/employeeSalaryRate.api'
import type {
  ICreateEmployeeSalaryRate,
  IEmployeeSalaryRate,
  IUpdateEmployeeSalaryRate,
} from '@/types/EmployeeSalaryRateType'

const KEY = 'employee-salary-rates'

export function useEmployeeSalaryRates(employeeId: string | undefined) {
  return useQuery<IEmployeeSalaryRate[]>({
    queryKey: [KEY, employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const res = await employeeSalaryRateApi.getByEmployee(employeeId as string)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreateEmployeeSalaryRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateEmployeeSalaryRate) =>
      employeeSalaryRateApi.createRate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateEmployeeSalaryRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; data: IUpdateEmployeeSalaryRate }) =>
      employeeSalaryRateApi.updateRate(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteEmployeeSalaryRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeeSalaryRateApi.deleteRate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

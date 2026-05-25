import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { payrollApi } from '@/api/payroll.api'
import type {
  IAddPayrollItem,
  ICreatePeriod,
  IPayrollDetail,
  IPayrollPeriod,
  IPayrollReport,
  IPayrollRow,
} from '@/types/PayrollType'

const PERIODS_KEY = ['payroll-periods'] as const

export function usePayrollPeriods() {
  return useQuery<IPayrollPeriod[]>({
    queryKey: PERIODS_KEY,
    queryFn: async () => {
      const res = await payrollApi.getPeriods()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function usePayrollRows(periodId: string | null) {
  return useQuery<IPayrollRow[]>({
    queryKey: ['payroll', periodId],
    enabled: !!periodId,
    queryFn: async () => {
      const res = await payrollApi.getPayroll(periodId as string)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreatePeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreatePeriod) => payrollApi.createPeriod(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PERIODS_KEY }),
  })
}

export function useLockPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payrollApi.lockPeriod(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PERIODS_KEY }),
  })
}

export function useMarkPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payrollApi.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PERIODS_KEY }),
  })
}

export function useGeneratePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => payrollApi.generate(periodId),
    onSuccess: (_data, periodId) =>
      qc.invalidateQueries({ queryKey: ['payroll', periodId] }),
  })
}

export function useEmployeePayroll(
  periodId: string | null,
  employeeId: string | null,
) {
  return useQuery<IPayrollDetail | null>({
    queryKey: ['payroll-detail', periodId, employeeId],
    enabled: !!periodId && !!employeeId,
    queryFn: async () => {
      const res = await payrollApi.getEmployeePayroll(
        periodId as string,
        employeeId as string,
      )
      if (!res.success) throw new Error(res.message)
      return res.data
    },
  })
}

export function useConfirmPayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payrollId: string) => payrollApi.confirmPayroll(payrollId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] })
      qc.invalidateQueries({ queryKey: ['payroll-detail'] })
    },
  })
}

export function useAddPayrollItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { payrollId: string; data: IAddPayrollItem }) =>
      payrollApi.addPayrollItem(vars.payrollId, vars.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] })
      qc.invalidateQueries({ queryKey: ['payroll-detail'] })
    },
  })
}

export function usePayrollReport(periodId: string | null) {
  return useQuery<IPayrollReport | null>({
    queryKey: ['payroll-report', periodId],
    enabled: !!periodId,
    queryFn: async () => {
      const res = await payrollApi.getReport(periodId as string)
      if (!res.success) throw new Error(res.message)
      return res.data
    },
  })
}

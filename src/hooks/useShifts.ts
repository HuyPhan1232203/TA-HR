import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shiftApi } from '@/api/shift.api'
import type {
  IAttendanceShiftConfig,
  ICreateShiftAssignment,
  ICreateShiftConfig,
  IEmployeeShiftAssignment,
} from '@/types/ShiftType'

const CONFIGS_KEY = ['shift-configs'] as const
const ASSIGN_KEY = 'shift-assignments'

export function useShiftConfigs() {
  return useQuery<IAttendanceShiftConfig[]>({
    queryKey: CONFIGS_KEY,
    queryFn: async () => {
      const res = await shiftApi.getConfigs()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
    // Cache shift configs across the app (guide §6: cache after login)
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useCreateShiftConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateShiftConfig) => shiftApi.createConfig(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGS_KEY }),
  })
}

export function useDeleteShiftConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => shiftApi.deleteConfig(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGS_KEY }),
  })
}

export function useEmployeeShiftAssignments(employeeId: string | undefined) {
  return useQuery<IEmployeeShiftAssignment[]>({
    queryKey: [ASSIGN_KEY, employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const res = await shiftApi.getAssignments(employeeId as string)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
    retry: false,
  })
}

export function useAssignShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { employeeId: string; data: ICreateShiftAssignment }) =>
      shiftApi.assignShift(vars.employeeId, vars.data),
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: [ASSIGN_KEY, vars.employeeId] }),
  })
}

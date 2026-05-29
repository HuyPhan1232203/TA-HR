import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { overtimeApi } from '@/api/overtime.api'
import type {
  IApproveOvertime,
  ICreateOvertimeRequest,
  IOvertimeFilter,
  IOvertimeRequest,
} from '@/types/OvertimeType'

const MY_KEY = ['overtime', 'mine'] as const
const MANAGE_KEY = ['overtime', 'manage'] as const

export function useMyOvertimeRequests() {
  return useQuery<IOvertimeRequest[]>({
    queryKey: MY_KEY,
    queryFn: async () => {
      const res = await overtimeApi.getMyOvertimeRequests()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
    retry: false,
  })
}

export function useCreateOvertimeRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateOvertimeRequest) =>
      overtimeApi.createOvertimeRequest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_KEY }),
  })
}

export function useOvertimeRequests(filter?: IOvertimeFilter) {
  return useQuery<IOvertimeRequest[]>({
    queryKey: [...MANAGE_KEY, filter ?? {}],
    queryFn: async () => {
      const res = await overtimeApi.getOvertimeRequests(filter)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useApproveOvertime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; data: IApproveOvertime }) =>
      overtimeApi.approveOvertimeRequest(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MANAGE_KEY }),
  })
}

export function useRejectOvertime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => overtimeApi.rejectOvertimeRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MANAGE_KEY }),
  })
}

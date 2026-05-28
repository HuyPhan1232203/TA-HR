import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { myAttendanceApi } from '@/api/myAttendance.api'
import type {
  IAdjustmentRequest,
  ICreateAdjustmentRequest,
} from '@/types/MyAttendanceType'

const REQUESTS_KEY = ['my-attendance', 'adjustment-requests'] as const

export function useMyAdjustmentRequests() {
  return useQuery<IAdjustmentRequest[]>({
    queryKey: REQUESTS_KEY,
    queryFn: async () => {
      const res = await myAttendanceApi.getAdjustmentRequests()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
    retry: false,
  })
}

export function useCheckIn() {
  return useMutation({ mutationFn: () => myAttendanceApi.checkIn() })
}

export function useCheckOut() {
  return useMutation({ mutationFn: () => myAttendanceApi.checkOut() })
}

export function useCreateAdjustmentRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateAdjustmentRequest) =>
      myAttendanceApi.createAdjustmentRequest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: REQUESTS_KEY }),
  })
}

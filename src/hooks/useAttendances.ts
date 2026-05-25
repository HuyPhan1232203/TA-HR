import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '@/api/attendance.api'
import type {
  IAttendance,
  IAttendanceFilter,
  ICreateAttendance,
} from '@/types/AttendanceType'

export function useAttendances(filter?: IAttendanceFilter) {
  return useQuery<IAttendance[]>({
    queryKey: ['attendances', filter],
    queryFn: async () => {
      const res = await attendanceApi.getAttendances(filter)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreateAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateAttendance) =>
      attendanceApi.createAttendance(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendances'] }),
  })
}

export function useDeleteAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => attendanceApi.deleteAttendance(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendances'] }),
  })
}

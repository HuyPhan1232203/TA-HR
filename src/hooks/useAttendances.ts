import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '@/api/attendance.api'
import type { IAttendanceRow, ICreateAttendance } from '@/types/AttendanceType'

export function useAttendances(month: string) {
  return useQuery<IAttendanceRow[]>({
    queryKey: ['attendances', month],
    queryFn: async () => {
      const res = await attendanceApi.getAttendances(month)
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['attendances'] }),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { holidayApi } from '@/api/holiday.api'
import type {
  ICreateHoliday,
  IHoliday,
  IHolidayFilter,
} from '@/types/HolidayType'

const KEY = ['holidays'] as const

export function useHolidays(filter?: IHolidayFilter) {
  return useQuery<IHoliday[]>({
    queryKey: [...KEY, filter ?? {}],
    queryFn: async () => {
      const res = await holidayApi.getHolidays(filter)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreateHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateHoliday) => holidayApi.createHoliday(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => holidayApi.deleteHoliday(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

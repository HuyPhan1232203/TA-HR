import { useQuery } from '@tanstack/react-query'
import { rateApi } from '@/api/rate.api'
import type { IProductOperationRate } from '@/types/RateType'

export function useRates() {
  return useQuery<IProductOperationRate[]>({
    queryKey: ['rates'],
    queryFn: async () => {
      const res = await rateApi.getRates()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

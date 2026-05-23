import { useQuery } from '@tanstack/react-query'
import { rateApi } from '@/api/rate.api'
import type { IProductOperationRate } from '@/types/RateType'

export function useProductRates(productCode: string) {
  return useQuery<IProductOperationRate[]>({
    queryKey: ['rates', productCode],
    queryFn: async () => {
      const res = await rateApi.getRates(productCode)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

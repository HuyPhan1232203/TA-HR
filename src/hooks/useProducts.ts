import { useQuery } from '@tanstack/react-query'
import { productApi } from '@/api/product.api'
import type { IProduct } from '@/types/ProductType'

export function useProducts() {
  return useQuery<IProduct[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productApi.getProducts()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

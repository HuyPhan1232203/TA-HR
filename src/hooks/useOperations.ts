import { useQuery } from '@tanstack/react-query'
import { operationApi } from '@/api/operation.api'
import type { IOperation } from '@/types/OperationType'

export function useOperations() {
  return useQuery<IOperation[]>({
    queryKey: ['operations'],
    queryFn: async () => {
      const res = await operationApi.getOperations()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

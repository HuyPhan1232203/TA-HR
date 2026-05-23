import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountApi } from '@/api/account.api'
import type {
  IAccount,
  IAccountFilter,
  ICreateAccount,
  IUpdateAccount,
} from '@/types/AccountType'
import type { PagingResponse } from '@/types'

const KEY = ['accounts'] as const

export function useAccounts(filter?: IAccountFilter) {
  return useQuery<PagingResponse<IAccount>>({
    queryKey: [...KEY, filter] as const,
    queryFn: async () => {
      const res = await accountApi.getAccounts(filter)
      if (!res.success) throw new Error(res.message)
      return res.data ?? { items: [], total: 0, page: 1, pageSize: 20 }
    },
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateAccount) => accountApi.createAccount(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; data: IUpdateAccount }) =>
      accountApi.updateAccount(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountApi.deleteAccount(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

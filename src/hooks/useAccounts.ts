import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountApi } from '@/api/account.api'
import type {
  IAccount,
  IAccountFilter,
  ICreateAccount,
  IUpdateAccount,
} from '@/types/AccountType'

const KEY = ['accounts'] as const

export function useAccounts(filter?: IAccountFilter) {
  return useQuery<IAccount[]>({
    queryKey: [...KEY, filter] as const,
    queryFn: async () => {
      const res = await accountApi.getAccounts(filter)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
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

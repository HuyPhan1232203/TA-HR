import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IAccount,
  IAccountFilter,
  ICreateAccount,
  IUpdateAccount,
} from '@/types/AccountType'
import { ACCOUNT_STATUSES, enumName, enumNum } from '@/lib/enums'
import type { AxiosResponse } from 'axios'

function hydrate(a: IAccount): IAccount {
  return { ...a, status: enumName(ACCOUNT_STATUSES, a.status) }
}

export const accountApi = {
  getAccounts: async (
    params?: IAccountFilter,
  ): Promise<ApiResponse<IAccount[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAccount[]>> =
        await axiosInstance.get('/accounts', { params })
      return { ...res.data, data: (res.data.data ?? []).map(hydrate) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createAccount: async (
    data: ICreateAccount,
  ): Promise<ApiResponse<IAccount>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAccount>> =
        await axiosInstance.post('/accounts', data)
      return { ...res.data, data: res.data.data && hydrate(res.data.data) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateAccount: async (
    id: string,
    data: IUpdateAccount,
  ): Promise<ApiResponse<IAccount>> => {
    try {
      const body: Record<string, unknown> = { ...data }
      if (data.status != null)
        body.status = enumNum(ACCOUNT_STATUSES, data.status)
      const res: AxiosResponse<ApiResponse<IAccount>> =
        await axiosInstance.put(`/accounts/${id}`, body)
      return { ...res.data, data: res.data.data && hydrate(res.data.data) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IAccount,
  IAccountFilter,
  ICreateAccount,
  IUpdateAccount,
} from '@/types/AccountType'
import type { AxiosResponse } from 'axios'

export const accountApi = {
  getAccounts: async (
    params?: IAccountFilter,
  ): Promise<ApiResponse<IAccount[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAccount[]>> =
        await axiosInstance.get('/accounts', { params })
      return res.data
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
      return res.data
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
      const res: AxiosResponse<ApiResponse<IAccount>> =
        await axiosInstance.put(`/accounts/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

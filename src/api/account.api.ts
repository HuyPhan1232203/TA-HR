import axiosInstance from '@/config/axios.config'
import type { ApiResponse, PagingResponse } from '@/types'
import type {
  IAccount,
  IAccountFilter,
  ICreateAccount,
  IUpdateAccount,
} from '@/types/AccountType'
import type { IPermission } from '@/types/PermissionType'
import type { AxiosResponse } from 'axios'

export const accountApi = {
  getAccounts: async (
    params?: IAccountFilter,
  ): Promise<ApiResponse<PagingResponse<IAccount>>> => {
    try {
      const res: AxiosResponse<ApiResponse<PagingResponse<IAccount>>> =
        await axiosInstance.get('/accounts', { params })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getAccountById: async (id: string): Promise<ApiResponse<IAccount>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAccount>> =
        await axiosInstance.get(`/accounts/${id}`)
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

  deleteAccount: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/accounts/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getAccountPermissions: async (
    accountId: string,
  ): Promise<ApiResponse<IPermission[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPermission[]>> =
        await axiosInstance.get(`/accounts/${accountId}/permissions`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  grantPermission: async (
    accountId: string,
    permissionId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post(`/accounts/${accountId}/permissions/${permissionId}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  revokePermission: async (
    accountId: string,
    permissionId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/accounts/${accountId}/permissions/${permissionId}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

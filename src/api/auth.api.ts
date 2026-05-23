import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IChangePasswordRequest,
  ILoginRequest,
  ILoginResponse,
  IMyPermissions,
} from '@/types/AuthType'
import type { AxiosResponse } from 'axios'

export const authApi = {
  login: async (data: ILoginRequest): Promise<ApiResponse<ILoginResponse>> => {
    try {
      const res: AxiosResponse<ApiResponse<ILoginResponse>> =
        await axiosInstance.post('/auth/login', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  myPermissions: async (): Promise<ApiResponse<IMyPermissions>> => {
    try {
      const res: AxiosResponse<ApiResponse<IMyPermissions>> =
        await axiosInstance.get('/auth/my-permissions')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  changePassword: async (
    data: IChangePasswordRequest,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post('/auth/change-password', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

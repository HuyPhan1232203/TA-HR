import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { ICreateRole, IRole, IUpdateRole } from '@/types/RoleType'
import type { AxiosResponse } from 'axios'

export const roleApi = {
  getRoles: async (): Promise<ApiResponse<IRole[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IRole[]>> =
        await axiosInstance.get('/roles')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createRole: async (data: ICreateRole): Promise<ApiResponse<IRole>> => {
    try {
      const res: AxiosResponse<ApiResponse<IRole>> =
        await axiosInstance.post('/roles', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateRole: async (
    id: string,
    data: IUpdateRole,
  ): Promise<ApiResponse<IRole>> => {
    try {
      const res: AxiosResponse<ApiResponse<IRole>> =
        await axiosInstance.put(`/roles/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

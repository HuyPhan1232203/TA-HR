import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IPermission } from '@/types/PermissionType'
import type { AxiosResponse } from 'axios'

export const permissionApi = {
  getPermissions: async (): Promise<ApiResponse<IPermission[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPermission[]>> =
        await axiosInstance.get('/permissions')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

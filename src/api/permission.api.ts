import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IPermissionGroup } from '@/types/PermissionType'
import type { AxiosResponse } from 'axios'

export const permissionApi = {
  getPermissions: async (): Promise<ApiResponse<IPermissionGroup[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPermissionGroup[]>> =
        await axiosInstance.get('/permissions')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IOperation } from '@/types/OperationType'
import type { AxiosResponse } from 'axios'

export const operationApi = {
  getOperations: async (): Promise<ApiResponse<IOperation[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IOperation[]>> =
        await axiosInstance.get('/operations')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

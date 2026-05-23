import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IProductOperationRate } from '@/types/RateType'
import type { AxiosResponse } from 'axios'

export const rateApi = {
  getRates: async (): Promise<ApiResponse<IProductOperationRate[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProductOperationRate[]>> =
        await axiosInstance.get('/product-operation-rates')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

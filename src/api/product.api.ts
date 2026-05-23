import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IProduct } from '@/types/ProductType'
import type { AxiosResponse } from 'axios'

export const productApi = {
  getProducts: async (): Promise<ApiResponse<IProduct[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProduct[]>> =
        await axiosInstance.get('/products')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

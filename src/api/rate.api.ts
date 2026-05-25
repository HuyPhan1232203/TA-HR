import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreateProductOperationRate,
  IProductOperationRate,
  IUpdateProductOperationRate,
} from '@/types/RateType'
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

  createRate: async (
    data: ICreateProductOperationRate,
  ): Promise<ApiResponse<IProductOperationRate>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProductOperationRate>> =
        await axiosInstance.post('/product-operation-rates', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateRate: async (
    id: string,
    data: IUpdateProductOperationRate,
  ): Promise<ApiResponse<IProductOperationRate>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProductOperationRate>> =
        await axiosInstance.put(`/product-operation-rates/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteRate: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/product-operation-rates/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

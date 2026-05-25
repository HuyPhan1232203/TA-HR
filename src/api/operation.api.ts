import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreateOperation,
  IOperation,
  IUpdateOperation,
} from '@/types/OperationType'
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

  createOperation: async (
    data: ICreateOperation,
  ): Promise<ApiResponse<IOperation>> => {
    try {
      const res: AxiosResponse<ApiResponse<IOperation>> =
        await axiosInstance.post('/operations', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateOperation: async (
    id: string,
    data: IUpdateOperation,
  ): Promise<ApiResponse<IOperation>> => {
    try {
      const res: AxiosResponse<ApiResponse<IOperation>> =
        await axiosInstance.put(`/operations/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteOperation: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/operations/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

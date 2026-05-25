import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IAddProductOperation,
  ICreateProduct,
  IProduct,
  IProductOperation,
  IUpdateProduct,
} from '@/types/ProductType'
import type { IProductOperationRate } from '@/types/RateType'
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

  createProduct: async (
    data: ICreateProduct,
  ): Promise<ApiResponse<IProduct>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProduct>> =
        await axiosInstance.post('/products', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateProduct: async (
    id: string,
    data: IUpdateProduct,
  ): Promise<ApiResponse<IProduct>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProduct>> =
        await axiosInstance.put(`/products/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteProduct: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/products/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getProductOperations: async (
    productId: string,
  ): Promise<ApiResponse<IProductOperation[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProductOperation[]>> =
        await axiosInstance.get(`/products/${productId}/operations`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  addProductOperation: async (
    productId: string,
    data: IAddProductOperation,
  ): Promise<ApiResponse<IProductOperation>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProductOperation>> =
        await axiosInstance.post(`/products/${productId}/operations`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getProductOperationRates: async (
    productId: string,
    operationId: string,
  ): Promise<ApiResponse<IProductOperationRate[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProductOperationRate[]>> =
        await axiosInstance.get(
          `/products/${productId}/operations/${operationId}/rates`,
        )
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  removeProductOperation: async (
    productId: string,
    operationId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(
          `/products/${productId}/operations/${operationId}`,
        )
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

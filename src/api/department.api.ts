import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreateDepartment,
  IDepartment,
  IUpdateDepartment,
} from '@/types/DepartmentType'
import type { AxiosResponse } from 'axios'

export const departmentApi = {
  getDepartments: async (): Promise<ApiResponse<IDepartment[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IDepartment[]>> =
        await axiosInstance.get('/departments')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createDepartment: async (
    data: ICreateDepartment,
  ): Promise<ApiResponse<IDepartment>> => {
    try {
      const res: AxiosResponse<ApiResponse<IDepartment>> =
        await axiosInstance.post('/departments', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateDepartment: async (
    id: string,
    data: IUpdateDepartment,
  ): Promise<ApiResponse<IDepartment>> => {
    try {
      const res: AxiosResponse<ApiResponse<IDepartment>> =
        await axiosInstance.put(`/departments/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteDepartment: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/departments/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

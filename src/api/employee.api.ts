import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreateEmployee,
  IEmployee,
  IEmployeeFilter,
  IUpdateEmployee,
} from '@/types/EmployeeType'
import type { AxiosResponse } from 'axios'

export const employeeApi = {
  getEmployees: async (
    params?: IEmployeeFilter,
  ): Promise<ApiResponse<IEmployee[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployee[]>> =
        await axiosInstance.get('/employees', { params })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getEmployeeById: async (id: string): Promise<ApiResponse<IEmployee>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployee>> =
        await axiosInstance.get(`/employees/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createEmployee: async (
    data: ICreateEmployee,
  ): Promise<ApiResponse<IEmployee>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployee>> =
        await axiosInstance.post('/employees', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateEmployee: async (
    id: string,
    data: IUpdateEmployee,
  ): Promise<ApiResponse<IEmployee>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployee>> =
        await axiosInstance.put(`/employees/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteEmployee: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/employees/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

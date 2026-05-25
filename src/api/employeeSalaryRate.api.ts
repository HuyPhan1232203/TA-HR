import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreateEmployeeSalaryRate,
  IEmployeeSalaryRate,
  IUpdateEmployeeSalaryRate,
} from '@/types/EmployeeSalaryRateType'
import type { AxiosResponse } from 'axios'

export const employeeSalaryRateApi = {
  getByEmployee: async (
    employeeId: string,
  ): Promise<ApiResponse<IEmployeeSalaryRate[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployeeSalaryRate[]>> =
        await axiosInstance.get(`/employee-salary-rates/${employeeId}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createRate: async (
    data: ICreateEmployeeSalaryRate,
  ): Promise<ApiResponse<IEmployeeSalaryRate>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployeeSalaryRate>> =
        await axiosInstance.post('/employee-salary-rates', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateRate: async (
    id: string,
    data: IUpdateEmployeeSalaryRate,
  ): Promise<ApiResponse<IEmployeeSalaryRate>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployeeSalaryRate>> =
        await axiosInstance.put(`/employee-salary-rates/${id}`, data)
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
        await axiosInstance.delete(`/employee-salary-rates/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

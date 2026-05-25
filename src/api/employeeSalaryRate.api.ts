import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreateEmployeeSalaryRate,
  IEmployeeSalaryRate,
  IUpdateEmployeeSalaryRate,
} from '@/types/EmployeeSalaryRateType'
import { SALARY_CALC_TYPES, enumName, enumNum } from '@/lib/enums'
import type { AxiosResponse } from 'axios'

function hydrate(r: IEmployeeSalaryRate): IEmployeeSalaryRate {
  return { ...r, calculationType: enumName(SALARY_CALC_TYPES, r.calculationType) }
}

export const employeeSalaryRateApi = {
  getByEmployee: async (
    employeeId: string,
  ): Promise<ApiResponse<IEmployeeSalaryRate[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployeeSalaryRate[]>> =
        await axiosInstance.get(`/employee-salary-rates/${employeeId}`)
      return { ...res.data, data: (res.data.data ?? []).map(hydrate) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createRate: async (
    data: ICreateEmployeeSalaryRate,
  ): Promise<ApiResponse<IEmployeeSalaryRate>> => {
    try {
      const body = {
        ...data,
        calculationType: enumNum(SALARY_CALC_TYPES, data.calculationType),
      }
      const res: AxiosResponse<ApiResponse<IEmployeeSalaryRate>> =
        await axiosInstance.post('/employee-salary-rates', body)
      return { ...res.data, data: res.data.data && hydrate(res.data.data) }
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
      const body: Record<string, unknown> = { ...data }
      if (data.calculationType != null)
        body.calculationType = enumNum(SALARY_CALC_TYPES, data.calculationType)
      const res: AxiosResponse<ApiResponse<IEmployeeSalaryRate>> =
        await axiosInstance.put(`/employee-salary-rates/${id}`, body)
      return { ...res.data, data: res.data.data && hydrate(res.data.data) }
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

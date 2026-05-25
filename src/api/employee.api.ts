import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreateEmployee,
  IEmployee,
  IEmployeeFilter,
  IUpdateEmployee,
} from '@/types/EmployeeType'
import { EMPLOYEE_STATUSES, SALARY_CALC_TYPES, enumName, enumNum } from '@/lib/enums'
import type { AxiosResponse } from 'axios'

// Backend sends enums as ints — normalise to string names for the app.
function hydrate(e: IEmployee): IEmployee {
  return {
    ...e,
    status: enumName(EMPLOYEE_STATUSES, e.status),
    salaryCalculationType: enumName(SALARY_CALC_TYPES, e.salaryCalculationType),
  }
}

export const employeeApi = {
  getEmployees: async (
    params?: IEmployeeFilter,
  ): Promise<ApiResponse<IEmployee[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployee[]>> =
        await axiosInstance.get('/employees', { params })
      return { ...res.data, data: (res.data.data ?? []).map(hydrate) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createEmployee: async (
    data: ICreateEmployee,
  ): Promise<ApiResponse<IEmployee>> => {
    try {
      const body = {
        ...data,
        salaryCalculationType: enumNum(SALARY_CALC_TYPES, data.salaryCalculationType),
      }
      const res: AxiosResponse<ApiResponse<IEmployee>> =
        await axiosInstance.post('/employees', body)
      return { ...res.data, data: res.data.data && hydrate(res.data.data) }
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
      const body: Record<string, unknown> = { ...data }
      if (data.salaryCalculationType != null)
        body.salaryCalculationType = enumNum(
          SALARY_CALC_TYPES,
          data.salaryCalculationType,
        )
      if (data.status != null)
        body.status = enumNum(EMPLOYEE_STATUSES, data.status)
      const res: AxiosResponse<ApiResponse<IEmployee>> =
        await axiosInstance.put(`/employees/${id}`, body)
      return { ...res.data, data: res.data.data && hydrate(res.data.data) }
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

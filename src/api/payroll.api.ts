import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreatePeriod,
  IGenerateResult,
  IPayrollPeriod,
  IPayrollReport,
  IPayrollRow,
} from '@/types/PayrollType'
import type { AxiosResponse } from 'axios'

export const payrollApi = {
  getPeriods: async (): Promise<ApiResponse<IPayrollPeriod[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPayrollPeriod[]>> =
        await axiosInstance.get('/payroll-periods')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createPeriod: async (
    data: ICreatePeriod,
  ): Promise<ApiResponse<IPayrollPeriod>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPayrollPeriod>> =
        await axiosInstance.post('/payroll-periods', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  lockPeriod: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post(`/payroll-periods/${id}/lock`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  markPaid: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post(`/payroll-periods/${id}/paid`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getPayroll: async (
    periodId: string,
  ): Promise<ApiResponse<IPayrollRow[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPayrollRow[]>> =
        await axiosInstance.get(`/payrolls/${periodId}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  generate: async (
    periodId: string,
  ): Promise<ApiResponse<IGenerateResult>> => {
    try {
      const res: AxiosResponse<ApiResponse<IGenerateResult>> =
        await axiosInstance.post('/payrolls/generate', {
          payrollPeriodId: periodId,
        })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getReport: async (
    periodId: string,
  ): Promise<ApiResponse<IPayrollReport>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPayrollReport>> =
        await axiosInstance.get(`/payroll-reports/periods/${periodId}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

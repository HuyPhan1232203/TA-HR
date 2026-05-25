import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IAttendanceShiftConfig,
  ICreateShiftAssignment,
  ICreateShiftConfig,
  IEmployeeShiftAssignment,
} from '@/types/ShiftType'
import type { AxiosResponse } from 'axios'

export const shiftApi = {
  getConfigs: async (): Promise<ApiResponse<IAttendanceShiftConfig[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAttendanceShiftConfig[]>> =
        await axiosInstance.get('/attendance-shift-configs')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createConfig: async (
    data: ICreateShiftConfig,
  ): Promise<ApiResponse<IAttendanceShiftConfig>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAttendanceShiftConfig>> =
        await axiosInstance.post('/attendance-shift-configs', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteConfig: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/attendance-shift-configs/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getAssignments: async (
    employeeId: string,
  ): Promise<ApiResponse<IEmployeeShiftAssignment[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployeeShiftAssignment[]>> =
        await axiosInstance.get(`/employees/${employeeId}/shift-assignments`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  assignShift: async (
    employeeId: string,
    data: ICreateShiftAssignment,
  ): Promise<ApiResponse<IEmployeeShiftAssignment>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployeeShiftAssignment>> =
        await axiosInstance.post(
          `/employees/${employeeId}/shift-assignments`,
          data,
        )
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

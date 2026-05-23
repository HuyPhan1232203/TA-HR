import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IAttendanceRow, ICreateAttendance } from '@/types/AttendanceType'
import type { AxiosResponse } from 'axios'

export const attendanceApi = {
  getAttendances: async (
    month: string,
  ): Promise<ApiResponse<IAttendanceRow[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAttendanceRow[]>> =
        await axiosInstance.get('/attendances', { params: { month } })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createAttendance: async (
    data: ICreateAttendance,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post('/attendances', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

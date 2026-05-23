import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IAttendance,
  IAttendanceFilter,
  ICreateAttendance,
} from '@/types/AttendanceType'
import type { AxiosResponse } from 'axios'

export const attendanceApi = {
  getAttendances: async (
    params?: IAttendanceFilter,
  ): Promise<ApiResponse<IAttendance[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAttendance[]>> =
        await axiosInstance.get('/attendances', { params })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createAttendance: async (
    data: ICreateAttendance,
  ): Promise<ApiResponse<IAttendance>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAttendance>> =
        await axiosInstance.post('/attendances', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

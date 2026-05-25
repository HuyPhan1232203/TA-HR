import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IAttendance,
  IAttendanceFilter,
  ICreateAttendance,
} from '@/types/AttendanceType'
import { ATTENDANCE_STATUSES, enumName } from '@/lib/enums'
import type { AxiosResponse } from 'axios'

function hydrate(a: IAttendance): IAttendance {
  return { ...a, status: enumName(ATTENDANCE_STATUSES, a.status) }
}

export const attendanceApi = {
  getAttendances: async (
    params?: IAttendanceFilter,
  ): Promise<ApiResponse<IAttendance[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAttendance[]>> =
        await axiosInstance.get('/attendances', { params })
      return { ...res.data, data: (res.data.data ?? []).map(hydrate) }
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
      return { ...res.data, data: res.data.data && hydrate(res.data.data) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteAttendance: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/attendances/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreateHoliday,
  IHoliday,
  IHolidayFilter,
} from '@/types/HolidayType'
import type { AxiosResponse } from 'axios'

export const holidayApi = {
  getHolidays: async (
    params?: IHolidayFilter,
  ): Promise<ApiResponse<IHoliday[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IHoliday[]>> =
        await axiosInstance.get('/holidays', { params })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createHoliday: async (
    data: ICreateHoliday,
  ): Promise<ApiResponse<IHoliday>> => {
    try {
      const res: AxiosResponse<ApiResponse<IHoliday>> =
        await axiosInstance.post('/holidays', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteHoliday: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/holidays/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IAdjustmentRequest,
  ICreateAdjustmentRequest,
} from '@/types/MyAttendanceType'
import { REQUEST_STATUSES, REQUEST_TYPES, enumName, enumNum } from '@/lib/enums'
import type { AxiosResponse } from 'axios'

function hydrate(r: IAdjustmentRequest): IAdjustmentRequest {
  return {
    ...r,
    requestType: enumName(REQUEST_TYPES, r.requestType),
    status: enumName(REQUEST_STATUSES, r.status),
  }
}

export const myAttendanceApi = {
  checkIn: async (): Promise<ApiResponse<unknown>> => {
    try {
      const res: AxiosResponse<ApiResponse<unknown>> =
        await axiosInstance.post('/my-attendance/check-in')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  checkOut: async (): Promise<ApiResponse<unknown>> => {
    try {
      const res: AxiosResponse<ApiResponse<unknown>> =
        await axiosInstance.post('/my-attendance/check-out')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getAdjustmentRequests: async (): Promise<ApiResponse<IAdjustmentRequest[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAdjustmentRequest[]>> =
        await axiosInstance.get('/my-attendance/adjustment-requests')
      return { ...res.data, data: (res.data.data ?? []).map(hydrate) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createAdjustmentRequest: async (
    data: ICreateAdjustmentRequest,
  ): Promise<ApiResponse<IAdjustmentRequest>> => {
    try {
      const body = {
        ...data,
        requestType: enumNum(REQUEST_TYPES, data.requestType),
      }
      const res: AxiosResponse<ApiResponse<IAdjustmentRequest>> =
        await axiosInstance.post('/my-attendance/adjustment-requests', body)
      return { ...res.data, data: res.data.data && hydrate(res.data.data) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

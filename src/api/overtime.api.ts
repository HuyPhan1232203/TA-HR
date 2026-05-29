import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IApproveOvertime,
  ICreateOvertimeRequest,
  IOvertimeFilter,
  IOvertimeRequest,
} from '@/types/OvertimeType'
import { OVERTIME_STATUSES, enumName, enumNum } from '@/lib/enums'
import type { AxiosResponse } from 'axios'

function hydrate(r: IOvertimeRequest): IOvertimeRequest {
  return { ...r, status: enumName(OVERTIME_STATUSES, r.status) }
}

export const overtimeApi = {
  // Employee self-service
  getMyOvertimeRequests: async (): Promise<ApiResponse<IOvertimeRequest[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IOvertimeRequest[]>> =
        await axiosInstance.get('/my-attendance/overtime-requests')
      return { ...res.data, data: (res.data.data ?? []).map(hydrate) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createOvertimeRequest: async (
    data: ICreateOvertimeRequest,
  ): Promise<ApiResponse<IOvertimeRequest>> => {
    try {
      const res: AxiosResponse<ApiResponse<IOvertimeRequest>> =
        await axiosInstance.post('/my-attendance/overtime-requests', data)
      return { ...res.data, data: res.data.data && hydrate(res.data.data) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // Manager / HR
  getOvertimeRequests: async (
    filter?: IOvertimeFilter,
  ): Promise<ApiResponse<IOvertimeRequest[]>> => {
    try {
      const params: Record<string, unknown> = {}
      if (filter?.status) params.status = enumNum(OVERTIME_STATUSES, filter.status)
      if (filter?.fromDate) params.fromDate = filter.fromDate
      if (filter?.toDate) params.toDate = filter.toDate
      const res: AxiosResponse<ApiResponse<IOvertimeRequest[]>> =
        await axiosInstance.get('/overtime-requests', { params })
      return { ...res.data, data: (res.data.data ?? []).map(hydrate) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  approveOvertimeRequest: async (
    id: string,
    data: IApproveOvertime,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post(`/overtime-requests/${id}/approve`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  rejectOvertimeRequest: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post(`/overtime-requests/${id}/reject`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

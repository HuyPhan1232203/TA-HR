import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IAuditLog } from '@/types/AuditLogType'
import type { AxiosResponse } from 'axios'

export const auditLogApi = {
  getAuditLogs: async (): Promise<ApiResponse<IAuditLog[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAuditLog[]>> =
        await axiosInstance.get('/audit-logs')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

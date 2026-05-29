import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IAddPayrollItem,
  ICreatePeriod,
  IGenerateResult,
  IPayrollDetail,
  IPayrollPeriod,
  IPayrollReport,
  IPayrollRow,
  ITransferBatch,
} from '@/types/PayrollType'
import {
  PAYROLL_ITEM_TYPES,
  PAYROLL_STATUSES,
  PERIOD_STATUSES,
  enumName,
  enumNum,
} from '@/lib/enums'
import type { AxiosResponse } from 'axios'

const hydratePeriod = (p: IPayrollPeriod): IPayrollPeriod => ({
  ...p,
  status: enumName(PERIOD_STATUSES, p.status),
})

const hydrateRow = (r: IPayrollRow): IPayrollRow => ({
  ...r,
  status: enumName(PAYROLL_STATUSES, r.status),
})

const hydrateDetail = (d: IPayrollDetail): IPayrollDetail => ({
  ...d,
  status: enumName(PAYROLL_STATUSES, d.status),
  items: (d.items ?? []).map((it) => ({
    ...it,
    type: enumName(PAYROLL_ITEM_TYPES, it.type),
  })),
})

export const payrollApi = {
  getPeriods: async (): Promise<ApiResponse<IPayrollPeriod[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPayrollPeriod[]>> =
        await axiosInstance.get('/payroll-periods')
      return { ...res.data, data: (res.data.data ?? []).map(hydratePeriod) }
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
      return { ...res.data, data: res.data.data && hydratePeriod(res.data.data) }
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

  deletePeriod: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/payroll-periods/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getPayroll: async (periodId: string): Promise<ApiResponse<IPayrollRow[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPayrollRow[]>> =
        await axiosInstance.get(`/payrolls/${periodId}`)
      return { ...res.data, data: (res.data.data ?? []).map(hydrateRow) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  generate: async (periodId: string): Promise<ApiResponse<IGenerateResult>> => {
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

  getEmployeePayroll: async (
    periodId: string,
    employeeId: string,
  ): Promise<ApiResponse<IPayrollDetail>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPayrollDetail>> =
        await axiosInstance.get(
          `/payrolls/${periodId}/employees/${employeeId}`,
        )
      return { ...res.data, data: res.data.data && hydrateDetail(res.data.data) }
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  confirmPayroll: async (
    payrollId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post(`/payrolls/${payrollId}/confirm`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  addPayrollItem: async (
    payrollId: string,
    data: IAddPayrollItem,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const body = { ...data, type: enumNum(PAYROLL_ITEM_TYPES, data.type) }
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post(`/payrolls/${payrollId}/items`, body)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // POST /api/payrolls/{periodId}/transfer-batch — downloads the .xlsx file.
  // Backend rejects (400/409) if employees miss required bank info (guide §10).
  transferBatch: async (
    periodId: string,
    data: ITransferBatch,
  ): Promise<void> => {
    try {
      const res = await axiosInstance.post(
        `/payrolls/${periodId}/transfer-batch`,
        data,
        { responseType: 'blob' },
      )
      const blob = res.data as Blob
      const cd = res.headers['content-disposition'] as string | undefined
      let filename = `transfer-batch-${periodId}.xlsx`
      const m = cd && /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd)
      if (m) filename = decodeURIComponent(m[1])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      // With responseType 'blob' an error body is also a Blob — read it back
      // so the JSON `message` can be surfaced to the user.
      const blobData = (error as { response?: { data?: unknown } }).response
        ?.data
      if (blobData instanceof Blob) {
        const text = await blobData.text()
        let message = text || 'Xuất chuyển khoản thất bại'
        try {
          const parsed = JSON.parse(text) as { message?: string }
          if (parsed.message) message = parsed.message
        } catch {
          // body wasn't JSON — keep the raw text
        }
        throw new Error(message, { cause: error })
      }
      console.error(error)
      throw error
    }
  },
}

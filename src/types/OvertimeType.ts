// Overtime workflow, decoupled from check-in/out (guide §7). Approved requests
// create a comp-time allocation in the chosen payroll period.

export type OvertimeStatus = 'Pending' | 'Approved' | 'Rejected'

// Backend sends status as 1-based int; api layer hydrates to name.
export interface IOvertimeRequest {
  id: string
  employeeId: string
  employeeCode?: string
  employeeName?: string
  workDate: string
  hours: number
  reason: string
  status: OvertimeStatus
  compensationPayrollPeriodId?: string | null
  requestedAtUtc?: string
}

// POST /api/my-attendance/overtime-requests
export interface ICreateOvertimeRequest {
  workDate: string
  hours: number
  reason: string
}

// POST /api/overtime-requests/{id}/approve
export interface IApproveOvertime {
  compensationPayrollPeriodId: string
}

// GET /api/overtime-requests?status=&fromDate=&toDate=
export interface IOvertimeFilter {
  status?: OvertimeStatus
  fromDate?: string
  toDate?: string
}

// Employee self-service attendance (guide §9). Times are "HH:mm" strings.

export type AdjustmentRequestType = 'LateArrival' | 'EarlyLeave'
export type AdjustmentRequestStatus = 'Pending' | 'Approved' | 'Rejected'

// GET /api/my-attendance/adjustment-requests — backend sends requestType/status
// as 1-based ints; the api layer hydrates them to names.
export interface IAdjustmentRequest {
  id: string
  workDate: string
  requestType: AdjustmentRequestType
  requestedTime: string
  reason: string
  status: AdjustmentRequestStatus
  requestedAtUtc?: string
}

// POST /api/my-attendance/adjustment-requests
export interface ICreateAdjustmentRequest {
  workDate: string
  requestType: AdjustmentRequestType
  requestedTime: string
  reason: string
}

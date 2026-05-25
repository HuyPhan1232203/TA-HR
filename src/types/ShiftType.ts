// Attendance shift configuration (guide §6) + employee shift assignment (§7).
// Times are plain "HH:mm" strings.

export interface IShiftSession {
  sessionOrder: number
  checkIn: string
  checkOut: string
  hours: number
}

// GET /api/attendance-shift-configs
export interface IAttendanceShiftConfig {
  id: string
  shiftCode: string
  name: string
  totalHours: number
  sessions: IShiftSession[]
}

// POST /api/attendance-shift-configs — backend derives hours/order/total
export interface ICreateShiftConfig {
  shiftCode: string
  name: string
  sessions: { checkIn: string; checkOut: string }[]
}

// GET /api/employees/{employeeId}/shift-assignments
export interface IEmployeeShiftAssignment {
  id: string
  employeeId: string
  attendanceShiftConfigId: string
  shiftCode: string
  shiftName: string
  totalHours: number
  effectiveFrom: string
  effectiveTo: string | null
  sessions: IShiftSession[]
}

// POST /api/employees/{employeeId}/shift-assignments
export interface ICreateShiftAssignment {
  attendanceShiftConfigId: string
  effectiveFrom: string
  effectiveTo?: string | null
}

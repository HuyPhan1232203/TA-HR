export type AttendanceStatus = 'Draft' | 'Confirmed'

export interface IAttendance {
  id: string
  employeeId: string
  workDate: string
  shiftCode?: string
  checkIn: string
  checkOut: string
  workingHours: number
  workingDayValue: number
  overtimeHours: number
  status: AttendanceStatus
}

export interface ICreateAttendance {
  employeeId: string
  workDate: string
  checkIn: string
  checkOut: string
  workingHours: number
  overtimeHours: number
}

export interface IAttendanceFilter {
  employeeId?: string
  fromDate?: string
  toDate?: string
}

import type { IEmployee } from './EmployeeType'

export type AttendanceKind = 'work' | 'ot' | 'leave' | 'off'

export interface IAttendanceCell {
  d: number
  kind: AttendanceKind
  hours?: number
}

export interface IAttendanceRow {
  employee: IEmployee
  cells: IAttendanceCell[]
}

export interface ICreateAttendance {
  employeeId: string
  date: string
  checkIn: string
  checkOut: string
  workHours: number
  otHours: number
  note?: string
}

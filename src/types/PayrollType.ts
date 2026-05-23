import type { IEmployee } from './EmployeeType'

export type PeriodStatus = 'Open' | 'Locked' | 'Paid'
export type PayrollRowStatus = 'Draft' | 'Confirmed'

export interface IPayrollPeriod {
  id: string
  name: string
  code: string
  startDate: string
  endDate: string
  status: PeriodStatus
  employees: number
  totalAmount: number | null
}

export interface ICreatePeriod {
  name: string
  code: string
  startDate: string
  endDate: string
  note?: string
}

export interface IPayrollRow {
  employee: IEmployee
  workDays: number
  ot: number
  piecework: number
  allowance: number
  deductions: number
  gross: number
  net: number
  status: PayrollRowStatus
}

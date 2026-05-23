export type PeriodStatus = 'Open' | 'Locked' | 'Paid'
export type PayrollRowStatus = 'Calculated' | 'Confirmed'

export interface IPayrollPeriod {
  id: string
  name: string
  fromDate: string
  toDate: string
  status: PeriodStatus
}

export interface ICreatePeriod {
  name: string
  fromDate: string
  toDate: string
}

export interface IPayrollRow {
  payrollId: string
  employeeId: string
  employeeCode: string
  employeeName: string
  attendanceSalary: number
  productSalary: number
  overtimeSalary: number
  grossSalary: number
  netSalary: number
  status: PayrollRowStatus
}

export interface IGenerateResult {
  payrollPeriodId: string
  employeeCount: number
  totalNetSalary: number
}

export interface IPayrollReport {
  payrollPeriodId: string
  periodName: string
  employeeCount: number
  totalAttendanceSalary: number
  totalProductSalary: number
  totalOvertimeSalary: number
  totalGrossSalary: number
  totalNetSalary: number
}

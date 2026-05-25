export type PeriodStatus = 'Open' | 'Locked' | 'Paid'
export type PayrollRowStatus = 'Calculated' | 'Confirmed'

export type PayrollItemType =
  | 'AttendanceSalary'
  | 'ProductSalary'
  | 'OvertimeSalary'
  | 'Allowance'
  | 'Bonus'
  | 'Deduction'
  | 'Insurance'
  | 'Tax'

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

// A single line in an employee payroll
export interface IPayrollItem {
  id: string
  type: PayrollItemType
  name: string
  quantity: number
  unitPrice: number
  amount: number
  sourceType?: string | null
  sourceId?: string | null
}

// Employee payroll detail (GET /api/payrolls/{periodId}/employees/{employeeId})
export interface IPayrollDetail {
  id: string
  payrollPeriodId: string
  employeeId: string
  employeeCode: string
  employeeFullName: string
  attendanceSalary: number
  productSalary: number
  overtimeSalary: number
  allowanceAmount: number
  bonusAmount: number
  deductionAmount: number
  grossSalary: number
  netSalary: number
  status: PayrollRowStatus
  items: IPayrollItem[]
}

// POST /api/payrolls/{payrollId}/items
export interface IAddPayrollItem {
  type: PayrollItemType
  name: string
  quantity: number
  unitPrice: number
  amount: number
}

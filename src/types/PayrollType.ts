// Backend PayrollPeriodStatus
export type PeriodStatus = 'Draft' | 'Open' | 'Locked' | 'Paid'
// Backend PayrollStatus
export type PayrollStatus =
  | 'Draft'
  | 'Calculated'
  | 'Confirmed'
  | 'Locked'
  | 'Paid'
  | 'Cancelled'

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
  // Working weekdays (1=Mon … 7=Sun) and standard hours/day (guide §8).
  workingDays: number[]
  standardHoursPerDay: number
}

// POST /api/payrolls/{periodId}/transfer-batch — returns an .xlsx file
// (guide §10). transactionType/feeType are bank-template enum numbers.
export interface ITransferBatch {
  sourceAccount: string
  description: string
  transactionType: number
  feeType: number
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
  status: PayrollStatus
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
  payrollId: string
  payrollPeriodId: string
  employeeId: string
  employeeCode: string
  employeeName: string
  attendanceSalary: number
  productSalary: number
  overtimeSalary: number
  allowanceAmount: number
  bonusAmount: number
  deductionAmount: number
  grossSalary: number
  netSalary: number
  status: PayrollStatus
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

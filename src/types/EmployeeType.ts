export type EmployeeStatus = 'Active' | 'Inactive' | 'Resigned'
export type SalaryCalculationType =
  | 'FixedMonthly'
  | 'DailyWage'
  | 'HourlyWage'
  | 'ProductBased'
  | 'Mixed'

export interface IEmployee {
  id: string
  code: string
  fullName: string
  departmentId: string
  positionName: string
  salaryCalculationType: SalaryCalculationType
  status: EmployeeStatus
  // Bank info for payroll transfer export (guide §4).
  bankAccountNumber?: string
  bankAccountName?: string
  bankBranchName?: string
  bankPartnerEmail?: string
}

// POST /api/employees — no status (server defaults to Active)
export type ICreateEmployee = Omit<IEmployee, 'id' | 'status'>
// PUT /api/employees/{id} — status settable
export type IUpdateEmployee = Partial<Omit<IEmployee, 'id'>>

// POST /api/employees/{id}/account — password/roleIds optional; server
// defaults password to `<username>@123` and role to `employee` (guide §8).
export interface ICreateEmployeeAccount {
  username: string
  password?: string | null
  roleIds?: string[]
}

export interface IEmployeeFilter {
  q?: string
  departmentId?: string
  status?: EmployeeStatus
}

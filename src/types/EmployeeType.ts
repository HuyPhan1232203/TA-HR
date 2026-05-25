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
}

// POST /api/employees — no status (server defaults to Active)
export type ICreateEmployee = Omit<IEmployee, 'id' | 'status'>
// PUT /api/employees/{id} — status settable
export type IUpdateEmployee = Partial<Omit<IEmployee, 'id'>>

export interface IEmployeeFilter {
  q?: string
  departmentId?: string
  status?: EmployeeStatus
}

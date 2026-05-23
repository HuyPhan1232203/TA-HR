export type EmployeeStatus = 'Active' | 'Inactive'
export type SalaryCalculationType = 'Monthly' | 'Daily' | 'Hourly' | 'Mixed'

export interface IEmployee {
  id: string
  code: string
  fullName: string
  departmentId: string
  positionName: string
  salaryCalculationType: SalaryCalculationType
  status: EmployeeStatus
}

export type ICreateEmployee = Omit<IEmployee, 'id'>
export type IUpdateEmployee = Partial<ICreateEmployee>

export interface IEmployeeFilter {
  q?: string
  departmentId?: string
  status?: EmployeeStatus
}

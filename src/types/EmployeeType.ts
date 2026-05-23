export type EmployeeStatus = 'Active' | 'Onleave' | 'Resigned'

export interface IEmployee {
  id: string
  code: string
  name: string
  dept: string
  role: string
  email: string
  phone: string
  status: EmployeeStatus
  joinedAt: string
  salary: number
}

export type ICreateEmployee = Omit<IEmployee, 'id'>
export type IUpdateEmployee = Partial<ICreateEmployee>

export interface IEmployeeFilter {
  q?: string
  dept?: string
  status?: EmployeeStatus
}

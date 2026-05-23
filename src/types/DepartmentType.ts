export type DepartmentStatus = 'Active' | 'Inactive'

export interface IDepartment {
  id: string
  code: string
  name: string
  status: DepartmentStatus
  headcount: number
  manager: string
}

export interface ICreateDepartment {
  code: string
  name: string
  status: DepartmentStatus
  manager: string
}

export type IUpdateDepartment = Partial<ICreateDepartment>

export interface IDepartment {
  id: string
  code: string
  name: string
  isActive: boolean
}

export interface ICreateDepartment {
  code: string
  name: string
  isActive: boolean
}

export type IUpdateDepartment = Partial<ICreateDepartment>

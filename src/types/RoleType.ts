export interface IRole {
  id: string
  code: string
  name: string
  description: string
  accounts: number
}

export interface ICreateRole {
  code: string
  name: string
  description: string
}

export type IUpdateRole = Partial<ICreateRole>

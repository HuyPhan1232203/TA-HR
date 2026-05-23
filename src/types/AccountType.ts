export type AccountStatus = 'Active' | 'Inactive'

export interface IAccount {
  id: string
  username: string
  fullName: string
  status: AccountStatus
  roles: string[]
  employeeId: string | null
}

export interface ICreateAccount {
  username: string
  fullName: string
  status: AccountStatus
  roleIds: string[]
  employeeId: string | null
  password?: string
}

export type IUpdateAccount = Partial<Omit<ICreateAccount, 'password'>>

export interface IAccountFilter {
  q?: string
  status?: AccountStatus
}

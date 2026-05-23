export type AccountStatus = 'Active' | 'Disabled'

export interface IAccount {
  id: string
  username: string
  employee: string | null
  fullName: string
  roles: string[]
  status: AccountStatus
  lastLogin: string
}

export interface ICreateAccount {
  username: string
  fullName: string
  employee: string | null
  roles: string[]
  status: AccountStatus
  password?: string
}

export type IUpdateAccount = Partial<Omit<ICreateAccount, 'password'>>

export interface IAccountFilter {
  q?: string
  role?: string
  status?: AccountStatus
  page?: number
  pageSize?: number
}

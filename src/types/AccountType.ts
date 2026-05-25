export type AccountStatus = 'Active' | 'Locked'

export interface IAccount {
  id: string
  username: string
  fullName: string
  status: AccountStatus
  roles: string[]
  employeeId: string | null
}

// POST /api/accounts — username + password, no status (created Active)
export interface ICreateAccount {
  username: string
  fullName: string
  password: string
  roleIds: string[]
  employeeId: string | null
}

// PUT /api/accounts/{id} — no username; optional password reset via newPassword
export interface IUpdateAccount {
  fullName?: string
  newPassword?: string
  status?: AccountStatus
  roleIds?: string[]
  employeeId?: string | null
}

export interface IAccountFilter {
  q?: string
  status?: AccountStatus
}

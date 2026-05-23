export interface ILoginRequest {
  username: string
  password: string
}

export interface ILoginResponse {
  accountId: string
  username: string
  fullName: string
  employeeId: string | null
  accessToken: string
  roles: string[]
}

export interface IMyPermissions {
  accountId: string
  permissions: string[]
}

export interface IAuthSession {
  accountId: string
  username: string
  fullName: string
  employeeId: string | null
  roles: string[]
  permissions: string[]
}

export interface IChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

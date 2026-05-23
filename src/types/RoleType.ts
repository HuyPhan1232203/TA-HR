export interface IRole {
  id: string
  code: string
  name: string
  isSystem: boolean
  isActive: boolean
  permissions: string[]
}

export interface ICreateRole {
  code: string
  name: string
  isActive: boolean
  permissionIds: string[]
}

export type IUpdateRole = Partial<ICreateRole>

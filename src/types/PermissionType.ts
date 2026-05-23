export interface IPermission {
  id: string
  module: string
  code: string
  name: string
  isActive: boolean
}

export interface IPermissionGroup {
  module: string
  permissions: IPermission[]
}

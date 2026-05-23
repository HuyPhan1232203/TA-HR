export interface IPermission {
  id: string
  code: string
  module: string
  label: string
}

export interface IPermissionGroup {
  module: string
  label: string
  perms: string[]
}

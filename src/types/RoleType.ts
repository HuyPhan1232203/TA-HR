export interface IRole {
  id: string
  code: string
  name: string
  isSystem: boolean
  isActive: boolean
  permissions: string[]
}

// POST /api/roles — {code, name, permissionIds}
export interface ICreateRole {
  code: string
  name: string
  permissionIds: string[]
}

// PUT /api/roles/{id} — {name, isActive, permissionIds} (no code)
export interface IUpdateRole {
  name?: string
  isActive?: boolean
  permissionIds?: string[]
}

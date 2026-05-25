export interface IDepartment {
  id: string
  code: string
  name: string
  isActive: boolean
}

// POST /api/departments — {code, name} only
export interface ICreateDepartment {
  code: string
  name: string
}

// PUT /api/departments/{id} — adds isActive
export interface IUpdateDepartment {
  code?: string
  name?: string
  isActive?: boolean
}

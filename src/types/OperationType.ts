export interface IOperation {
  id: string
  code: string
  name: string
  isActive: boolean
}

// POST /api/operations
export interface ICreateOperation {
  code: string
  name: string
}

// PUT /api/operations/{id}
export interface IUpdateOperation {
  code?: string
  name?: string
  isActive?: boolean
}

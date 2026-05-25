export interface IProduct {
  id: string
  code: string
  name: string
  unit: string
  isActive: boolean
}

// POST /api/products
export interface ICreateProduct {
  code: string
  name: string
  unit: string
}

// PUT /api/products/{id}
export interface IUpdateProduct {
  code?: string
  name?: string
  unit?: string
  isActive?: boolean
}

// Operation attached to a product (GET /api/products/{productId}/operations)
export interface IProductOperation {
  id: string
  productId: string
  operationId: string
  code: string
  name: string
}

// POST /api/products/{productId}/operations
export interface IAddProductOperation {
  operationId: string
  code: string
  name: string
}

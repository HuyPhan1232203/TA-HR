export type ProductStatus = 'Active' | 'Inactive'

export interface IProduct {
  id: string
  code: string
  name: string
  status: ProductStatus
  operations: number
  lastUpdated: string
}

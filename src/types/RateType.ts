export type WorkTimeType =
  | 'Regular'
  | 'OvertimeNormal'
  | 'OvertimeNight'
  | 'OvertimeSunday'
  | 'OvertimeHoliday'

export interface IProductOperationRate {
  id: string
  productId: string
  operationId: string
  workTimeType: WorkTimeType
  unitPrice: number
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
}

// POST /api/product-operation-rates
export interface ICreateProductOperationRate {
  productId: string
  operationId: string
  workTimeType: WorkTimeType
  unitPrice: number
  effectiveFrom: string
  effectiveTo?: string | null
}

// PUT /api/product-operation-rates/{id}
export interface IUpdateProductOperationRate {
  productId?: string
  operationId?: string
  workTimeType?: WorkTimeType
  unitPrice?: number
  effectiveFrom?: string
  effectiveTo?: string | null
  isActive?: boolean
}

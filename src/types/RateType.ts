export type WorkTimeType = 'Regular' | 'Overtime'

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

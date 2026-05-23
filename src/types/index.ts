export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

export interface PagingResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

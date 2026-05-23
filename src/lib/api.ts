import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { loadSession } from './auth-storage'

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? ''

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = loadSession()
  if (session?.accessToken) {
    config.headers.set('Authorization', `Bearer ${session.accessToken}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status
    if (status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    } else if (status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden'))
    }
    const message =
      error.response?.data?.message ?? error.message ?? 'Request failed'
    return Promise.reject(new Error(message))
  },
)

function unwrap<T>(body: ApiResponse<T>, fallbackMessage: string): T {
  if (!body.success) throw new Error(body.message || fallbackMessage)
  return body.data as T
}

export async function apiGet<T>(
  path: string,
  fallbackMessage = 'Không thể tải dữ liệu',
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.get<ApiResponse<T>>(path, config)
  return unwrap(res.data, fallbackMessage)
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  payload?: unknown,
  fallbackMessage = 'Thao tác không thành công',
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.request<ApiResponse<T>>({
    url: path,
    method,
    data: payload,
    ...config,
  })
  return unwrap(res.data, fallbackMessage)
}

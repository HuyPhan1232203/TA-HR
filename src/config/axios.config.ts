import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { clearSession, clearToken } from '@/lib/auth-storage'

const TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY

const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(TOKEN_KEY)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 403) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/403')) {
        const message = error.response?.data?.message
        toast.error(message || 'Bạn không có quyền truy cập tài nguyên này.')
        window.location.href = '/403'
      }
      return Promise.reject(error)
    }

    if (status === 401) {
      clearToken()
      clearSession()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)

export default axiosInstance

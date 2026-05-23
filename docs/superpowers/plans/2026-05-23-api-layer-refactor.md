# API Layer Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prototype data layer (`lib/api.ts` + `api/resources.ts` + `data/mock.ts`) with the team's standard: one configured axios instance, per-resource API modules, `I`-prefixed type files, react-query hooks, cookie-based auth, and `sonner` toasts — talking only to the real backend.

**Architecture:** A single `axios.config.ts` instance reads the access token from a cookie and attaches `Authorization`; its response interceptor centrally handles `401` (clear cookie → `/login`) and `403` (sonner toast → `/403`). Per-resource API modules (`*.api.ts`) wrap the instance and return `ApiResponse<T>` / `PagingResponse<T>`. react-query hooks (`hooks/*`) wrap those modules and own cache invalidation. Screens consume hooks only.

**Tech Stack:** React 19, TypeScript (verbatimModuleSyntax + erasableSyntaxOnly — type-only imports MUST use `import type`), Vite 8, axios, @tanstack/react-query v5, @tanstack/react-table v8, react-router-dom v7, js-cookie, sonner.

**Note on TDD:** This project has no test runner (per CLAUDE.md and the spec). Each task verifies with `pnpm build` (tsc typecheck) and `pnpm lint`, with a `pnpm dev` smoke test at the end. Where a step says "verify", run those commands.

---

## File Structure

**Create:**
- `src/config/axios.config.ts` — axios instance + interceptors
- `src/types/index.ts` — `ApiResponse<T>`, `PagingResponse<T>`
- `src/types/AuthType.ts`, `AccountType.ts`, `DepartmentType.ts`, `EmployeeType.ts`, `RoleType.ts`, `PermissionType.ts`, `AttendanceType.ts`, `PayrollType.ts`, `ProductType.ts`, `OperationType.ts`, `RateType.ts`, `AuditLogType.ts`
- `src/api/auth.api.ts`, `account.api.ts`, `department.api.ts`, `employee.api.ts`, `role.api.ts`, `permission.api.ts`, `attendance.api.ts`, `payroll.api.ts`, `product.api.ts`, `operation.api.ts`, `rate.api.ts`, `auditLog.api.ts`
- `src/hooks/useDepartments.ts`, `useEmployees.ts`, `useAccounts.ts`, `useRoles.ts`, `usePermissions.ts`, `useAttendances.ts`, `usePayroll.ts`, `useProducts.ts`, `useOperations.ts`, `useRates.ts`, `useAuditLogs.ts`
- `src/screens/forbidden.tsx` — `/403` page

**Modify:**
- `vite.config.ts` — add `@/` alias, drop `normalizeOrigin`
- `tsconfig.app.json` — add `baseUrl` + `paths`
- `.env`, `.env.example` — add `VITE_ACCESS_TOKEN_KEY`
- `src/vite-env.d.ts` — declare new env, drop `VITE_USE_MOCKS`
- `src/lib/auth-storage.ts` — token moves to cookie; session keeps user only
- `src/api/auth.ts` → replaced by `src/api/auth.api.ts` (delete old)
- `src/components/auth-context.tsx` — use cookie for token
- `src/screens/login.tsx` — use `authApi` + cookie + sonner
- `src/components/protected-route.tsx` — unchanged logic, verify imports
- `src/App.tsx` — `<Toaster/>`, drop `ToastProvider`, add `/403` route, `@/` imports
- `src/main.tsx` — (only if it referenced removed files; it does not)
- All 8 screens — swap `useToast` → `sonner`, swap `api/resources` hooks → new `hooks/*`

**Delete:**
- `src/lib/api.ts`
- `src/api/resources.ts`
- `src/api/auth.ts`
- `src/data/mock.ts`
- `src/components/ui/toast.tsx`

---

## Task 1: Dependencies, path alias, env

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json`
- Modify: `.env`, `.env.example`
- Modify: `src/vite-env.d.ts`

- [ ] **Step 1: Install runtime deps**

Run:
```bash
pnpm add js-cookie sonner && pnpm add -D @types/js-cookie
```
Expected: `js-cookie`, `sonner` in dependencies; `@types/js-cookie` in devDependencies.

- [ ] **Step 2: Add `@/` alias to Vite + drop normalizeOrigin**

Replace the entire contents of `vite.config.ts` with:
```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:8088/api'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiUrl.replace(/\/+$/, '').replace(/\/api$/i, ''),
          changeOrigin: true,
        },
      },
    },
  }
})
```

- [ ] **Step 3: Add `paths` to tsconfig.app.json**

In `tsconfig.app.json`, inside `compilerOptions`, add these two keys after `"jsx": "react-jsx",`:
```json
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
```

- [ ] **Step 4: Add token-key env vars**

In `.env`, add a second line so the file reads:
```
VITE_API_URL=http://100.85.237.107:8088/api/
VITE_ACCESS_TOKEN_KEY=hr_access_token
```

In `.env.example`, replace the whole file with:
```
VITE_API_URL=http://localhost:8088/api
VITE_ACCESS_TOKEN_KEY=hr_access_token
```

- [ ] **Step 5: Update env type declarations**

Replace `src/vite-env.d.ts` with:
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ACCESS_TOKEN_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts tsconfig.app.json .env.example src/vite-env.d.ts
git commit -m "chore: add js-cookie + sonner, @/ alias, token env key"
```
(Note: `.env` is gitignored; that's expected — only `.env.example` is committed.)

---

## Task 2: Shared types

**Files:**
- Create: `src/types/index.ts` and the 12 `*Type.ts` files

- [ ] **Step 1: Create `src/types/index.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/types/AuthType.ts`**

```ts
export interface ILoginRequest {
  username: string
  password: string
}

export interface ILoginResponse {
  accountId: string
  username: string
  fullName: string
  employeeId: string | null
  accessToken: string
  roles: string[]
}

export interface IAuthSession {
  accountId: string
  username: string
  fullName: string
  employeeId: string | null
  roles: string[]
  permissions: string[]
}

export interface IChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
```

- [ ] **Step 3: Create `src/types/DepartmentType.ts`**

```ts
export type DepartmentStatus = 'Active' | 'Inactive'

export interface IDepartment {
  id: string
  code: string
  name: string
  status: DepartmentStatus
  headcount: number
  manager: string
}

export interface ICreateDepartment {
  code: string
  name: string
  status: DepartmentStatus
  manager: string
}

export type IUpdateDepartment = Partial<ICreateDepartment>
```

- [ ] **Step 4: Create `src/types/EmployeeType.ts`**

```ts
export type EmployeeStatus = 'Active' | 'Onleave' | 'Resigned'

export interface IEmployee {
  id: string
  code: string
  name: string
  dept: string
  role: string
  email: string
  phone: string
  status: EmployeeStatus
  joinedAt: string
  salary: number
}

export type ICreateEmployee = Omit<IEmployee, 'id'>
export type IUpdateEmployee = Partial<ICreateEmployee>

export interface IEmployeeFilter {
  q?: string
  dept?: string
  status?: EmployeeStatus
}
```

- [ ] **Step 5: Create `src/types/RoleType.ts`**

```ts
export interface IRole {
  id: string
  code: string
  name: string
  description: string
  accounts: number
}

export interface ICreateRole {
  code: string
  name: string
  description: string
}

export type IUpdateRole = Partial<ICreateRole>
```

- [ ] **Step 6: Create `src/types/PermissionType.ts`**

```ts
export interface IPermission {
  id: string
  code: string
  module: string
  label: string
}

export interface IPermissionGroup {
  module: string
  label: string
  perms: string[]
}
```

- [ ] **Step 7: Create `src/types/AccountType.ts`**

```ts
export type AccountStatus = 'Active' | 'Disabled'

export interface IAccount {
  id: string
  username: string
  employee: string | null
  fullName: string
  roles: string[]
  status: AccountStatus
  lastLogin: string
}

export interface ICreateAccount {
  username: string
  fullName: string
  employee: string | null
  roles: string[]
  status: AccountStatus
  password?: string
}

export type IUpdateAccount = Partial<Omit<ICreateAccount, 'password'>>

export interface IAccountFilter {
  q?: string
  role?: string
  status?: AccountStatus
  page?: number
  pageSize?: number
}
```

- [ ] **Step 8: Create `src/types/AttendanceType.ts`**

```ts
export type AttendanceKind = 'work' | 'ot' | 'leave' | 'off'

export interface IAttendanceCell {
  d: number
  kind: AttendanceKind
  hours?: number
}

export interface IAttendanceRow {
  employee: import('./EmployeeType').IEmployee
  cells: IAttendanceCell[]
}

export interface ICreateAttendance {
  employeeId: string
  date: string
  checkIn: string
  checkOut: string
  workHours: number
  otHours: number
  note?: string
}
```

- [ ] **Step 9: Create `src/types/PayrollType.ts`**

```ts
import type { IEmployee } from './EmployeeType'

export type PeriodStatus = 'Open' | 'Locked' | 'Paid'
export type PayrollRowStatus = 'Draft' | 'Confirmed'

export interface IPayrollPeriod {
  id: string
  name: string
  code: string
  startDate: string
  endDate: string
  status: PeriodStatus
  employees: number
  totalAmount: number | null
}

export interface ICreatePeriod {
  name: string
  code: string
  startDate: string
  endDate: string
  note?: string
}

export interface IPayrollRow {
  employee: IEmployee
  workDays: number
  ot: number
  piecework: number
  allowance: number
  deductions: number
  gross: number
  net: number
  status: PayrollRowStatus
}
```

- [ ] **Step 10: Create `src/types/ProductType.ts`**

```ts
export type ProductStatus = 'Active' | 'Inactive'

export interface IProduct {
  id: string
  code: string
  name: string
  status: ProductStatus
  operations: number
  lastUpdated: string
}
```

- [ ] **Step 11: Create `src/types/OperationType.ts`**

```ts
export interface IOperation {
  id: string
  code: string
  name: string
  unit: string
  category: string
}
```

- [ ] **Step 12: Create `src/types/RateType.ts`**

```ts
export interface IProductOperationRate {
  id: string
  product: string
  operation: string
  rate: number
  effectiveFrom: string
}
```

- [ ] **Step 13: Create `src/types/AuditLogType.ts`**

```ts
export interface IAuditLog {
  id: string
  at: string
  actor: string
  action: string
  target: string
  ip: string
}
```

- [ ] **Step 14: Commit**

```bash
git add src/types
git commit -m "feat: add I-prefixed domain types + ApiResponse/PagingResponse"
```

---

## Task 3: axios.config.ts

**Files:**
- Create: `src/config/axios.config.ts`

- [ ] **Step 1: Write the instance + interceptors**

```ts
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import Cookies from 'js-cookie'
import { toast } from 'sonner'

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
      Cookies.remove(TOKEN_KEY)
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
```

- [ ] **Step 2: Verify it typechecks (will fully build later)**

Run: `pnpm exec tsc -b --noEmit` is not configured; instead defer — this file is exercised by Task 11 build. For now just confirm no syntax error by running:
`pnpm exec eslint src/config/axios.config.ts`
Expected: no errors (sonner + js-cookie resolve because Task 1 installed them).

- [ ] **Step 3: Commit**

```bash
git add src/config/axios.config.ts
git commit -m "feat: add cookie-based axios instance with 401/403 interceptors"
```

---

## Task 4: Auth API module + storage + context + login screen

**Files:**
- Create: `src/api/auth.api.ts`
- Modify: `src/lib/auth-storage.ts`
- Modify: `src/components/auth-context.tsx`
- Modify: `src/screens/login.tsx`
- Delete: `src/api/auth.ts`

- [ ] **Step 1: Create `src/api/auth.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  IChangePasswordRequest,
  ILoginRequest,
  ILoginResponse,
} from '@/types/AuthType'
import type { AxiosResponse } from 'axios'

export const authApi = {
  login: async (data: ILoginRequest): Promise<ApiResponse<ILoginResponse>> => {
    try {
      const res: AxiosResponse<ApiResponse<ILoginResponse>> =
        await axiosInstance.post('/auth/login', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  myPermissions: async (): Promise<ApiResponse<string[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<string[]>> =
        await axiosInstance.get('/auth/my-permissions')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  changePassword: async (
    data: IChangePasswordRequest,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post('/auth/change-password', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 2: Rewrite `src/lib/auth-storage.ts` (token → cookie, session keeps user)**

```ts
import Cookies from 'js-cookie'
import type { IAuthSession } from '@/types/AuthType'

const STORAGE_KEY = 'hr.auth'
const TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY

export function setToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7,
    secure: location.protocol === 'https:',
    sameSite: 'strict',
  })
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}

export function clearToken(): void {
  Cookies.remove(TOKEN_KEY)
}

export function loadSession(): IAuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as IAuthSession
  } catch {
    return null
  }
}

export function saveSession(session: IAuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
```

- [ ] **Step 3: Rewrite `src/components/auth-context.tsx`**

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  clearSession,
  clearToken,
  loadSession,
  saveSession,
} from '@/lib/auth-storage'
import type { IAuthSession } from '@/types/AuthType'

interface AuthContextValue {
  session: IAuthSession | null
  signIn: (session: IAuthSession) => void
  signOut: () => void
}

const AuthCtx = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<IAuthSession | null>(() => loadSession())

  const signIn = useCallback((next: IAuthSession) => {
    saveSession(next)
    setSession(next)
  }, [])

  const signOut = useCallback(() => {
    clearToken()
    clearSession()
    setSession(null)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => signOut()
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [signOut])

  return (
    <AuthCtx.Provider value={{ session, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Update `src/lib/permissions.ts` to the new session type**

Replace the import line `import type { AuthSession } from './auth-storage'` with:
```ts
import type { IAuthSession } from '@/types/AuthType'
```
Then change both `session: AuthSession | null` occurrences to `session: IAuthSession | null`.

- [ ] **Step 5: Rewrite the login submit in `src/screens/login.tsx`**

Replace the import block at the top (the lines importing `loginRequest`, `useAuth`, `API_BASE_URL`) with:
```tsx
import { useAuth } from '@/components/auth-context'
import { authApi } from '@/api/auth.api'
import { setToken } from '@/lib/auth-storage'
import { toast } from 'sonner'
```
Remove the `import { API_BASE_URL } from '../lib/api'` line entirely.

Replace the `onSubmit` handler body with:
```tsx
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.')
      return
    }
    setLoading(true)
    try {
      const loginRes = await authApi.login({ username, password })
      const login = loginRes.data
      if (!login) throw new Error(loginRes.message || 'Đăng nhập thất bại')

      setToken(login.accessToken)

      const permRes = await authApi.myPermissions()
      const permissions = permRes.data ?? []

      signIn({
        accountId: login.accountId,
        username: login.username,
        fullName: login.fullName,
        employeeId: login.employeeId,
        roles: login.roles,
        permissions,
      })
      toast.success('Đăng nhập thành công')
      const from = (location.state as FromState | null)?.from?.pathname ?? '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }
```

In the same file, find the footer line that renders `API {API_BASE_URL || '(proxy /api)'}` and replace `{API_BASE_URL || '(proxy /api)'}` with `{import.meta.env.VITE_API_URL}`.

- [ ] **Step 6: Delete the old auth module**

```bash
git rm src/api/auth.ts
```

- [ ] **Step 7: Verify lint on touched files**

Run: `pnpm exec eslint src/api/auth.api.ts src/lib/auth-storage.ts src/components/auth-context.tsx src/lib/permissions.ts src/screens/login.tsx`
Expected: no errors. (Full typecheck happens at Task 11 once all hooks exist.)

- [ ] **Step 8: Commit**

```bash
git add src/api/auth.api.ts src/lib/auth-storage.ts src/components/auth-context.tsx src/lib/permissions.ts src/screens/login.tsx
git commit -m "feat: cookie token + authApi login flow, drop old auth module"
```

---

## Task 5: Resource API modules

**Files:**
- Create: the 11 resource `*.api.ts` files

All paths are relative to `baseURL` (which already includes `/api`), so no `/api` prefix.

- [ ] **Step 1: `src/api/department.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreateDepartment,
  IDepartment,
  IUpdateDepartment,
} from '@/types/DepartmentType'
import type { AxiosResponse } from 'axios'

export const departmentApi = {
  getDepartments: async (): Promise<ApiResponse<IDepartment[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IDepartment[]>> =
        await axiosInstance.get('/departments')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createDepartment: async (
    data: ICreateDepartment,
  ): Promise<ApiResponse<IDepartment>> => {
    try {
      const res: AxiosResponse<ApiResponse<IDepartment>> =
        await axiosInstance.post('/departments', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateDepartment: async (
    id: string,
    data: IUpdateDepartment,
  ): Promise<ApiResponse<IDepartment>> => {
    try {
      const res: AxiosResponse<ApiResponse<IDepartment>> =
        await axiosInstance.put(`/departments/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteDepartment: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/departments/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 2: `src/api/employee.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreateEmployee,
  IEmployee,
  IEmployeeFilter,
  IUpdateEmployee,
} from '@/types/EmployeeType'
import type { AxiosResponse } from 'axios'

export const employeeApi = {
  getEmployees: async (
    params?: IEmployeeFilter,
  ): Promise<ApiResponse<IEmployee[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployee[]>> =
        await axiosInstance.get('/employees', { params })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getEmployeeById: async (id: string): Promise<ApiResponse<IEmployee>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployee>> =
        await axiosInstance.get(`/employees/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createEmployee: async (
    data: ICreateEmployee,
  ): Promise<ApiResponse<IEmployee>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployee>> =
        await axiosInstance.post('/employees', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateEmployee: async (
    id: string,
    data: IUpdateEmployee,
  ): Promise<ApiResponse<IEmployee>> => {
    try {
      const res: AxiosResponse<ApiResponse<IEmployee>> =
        await axiosInstance.put(`/employees/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteEmployee: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/employees/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 3: `src/api/account.api.ts`** (paged list per the team template)

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse, PagingResponse } from '@/types'
import type {
  IAccount,
  IAccountFilter,
  ICreateAccount,
  IUpdateAccount,
} from '@/types/AccountType'
import type { IPermission } from '@/types/PermissionType'
import type { AxiosResponse } from 'axios'

export const accountApi = {
  getAccounts: async (
    params?: IAccountFilter,
  ): Promise<ApiResponse<PagingResponse<IAccount>>> => {
    try {
      const res: AxiosResponse<ApiResponse<PagingResponse<IAccount>>> =
        await axiosInstance.get('/accounts', { params })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getAccountById: async (id: string): Promise<ApiResponse<IAccount>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAccount>> =
        await axiosInstance.get(`/accounts/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createAccount: async (
    data: ICreateAccount,
  ): Promise<ApiResponse<IAccount>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAccount>> =
        await axiosInstance.post('/accounts', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateAccount: async (
    id: string,
    data: IUpdateAccount,
  ): Promise<ApiResponse<IAccount>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAccount>> =
        await axiosInstance.put(`/accounts/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteAccount: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/accounts/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getAccountPermissions: async (
    accountId: string,
  ): Promise<ApiResponse<IPermission[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPermission[]>> =
        await axiosInstance.get(`/accounts/${accountId}/permissions`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  grantPermission: async (
    accountId: string,
    permissionId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post(`/accounts/${accountId}/permissions/${permissionId}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  revokePermission: async (
    accountId: string,
    permissionId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/accounts/${accountId}/permissions/${permissionId}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 4: `src/api/role.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { ICreateRole, IRole, IUpdateRole } from '@/types/RoleType'
import type { AxiosResponse } from 'axios'

export const roleApi = {
  getRoles: async (): Promise<ApiResponse<IRole[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IRole[]>> =
        await axiosInstance.get('/roles')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createRole: async (data: ICreateRole): Promise<ApiResponse<IRole>> => {
    try {
      const res: AxiosResponse<ApiResponse<IRole>> =
        await axiosInstance.post('/roles', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  updateRole: async (
    id: string,
    data: IUpdateRole,
  ): Promise<ApiResponse<IRole>> => {
    try {
      const res: AxiosResponse<ApiResponse<IRole>> =
        await axiosInstance.put(`/roles/${id}`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  deleteRole: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.delete(`/roles/${id}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 5: `src/api/permission.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IPermissionGroup } from '@/types/PermissionType'
import type { AxiosResponse } from 'axios'

export const permissionApi = {
  getPermissions: async (): Promise<ApiResponse<IPermissionGroup[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPermissionGroup[]>> =
        await axiosInstance.get('/permissions')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 6: `src/api/attendance.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IAttendanceRow, ICreateAttendance } from '@/types/AttendanceType'
import type { AxiosResponse } from 'axios'

export const attendanceApi = {
  getAttendances: async (
    month: string,
  ): Promise<ApiResponse<IAttendanceRow[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAttendanceRow[]>> =
        await axiosInstance.get('/attendances', { params: { month } })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createAttendance: async (
    data: ICreateAttendance,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post('/attendances', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 7: `src/api/payroll.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type {
  ICreatePeriod,
  IPayrollPeriod,
  IPayrollRow,
} from '@/types/PayrollType'
import type { AxiosResponse } from 'axios'

export const payrollApi = {
  getPeriods: async (): Promise<ApiResponse<IPayrollPeriod[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPayrollPeriod[]>> =
        await axiosInstance.get('/payroll-periods')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  createPeriod: async (
    data: ICreatePeriod,
  ): Promise<ApiResponse<IPayrollPeriod>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPayrollPeriod>> =
        await axiosInstance.post('/payroll-periods', data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  lockPeriod: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post(`/payroll-periods/${id}/lock`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  markPaid: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post(`/payroll-periods/${id}/paid`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getPayroll: async (
    periodId: string,
  ): Promise<ApiResponse<IPayrollRow[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IPayrollRow[]>> =
        await axiosInstance.get(`/payrolls/${periodId}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  generate: async (
    periodId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const res: AxiosResponse<ApiResponse<{ message: string }>> =
        await axiosInstance.post('/payrolls/generate', { periodId })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 8: `src/api/product.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IProduct } from '@/types/ProductType'
import type { AxiosResponse } from 'axios'

export const productApi = {
  getProducts: async (): Promise<ApiResponse<IProduct[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProduct[]>> =
        await axiosInstance.get('/products')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 9: `src/api/operation.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IOperation } from '@/types/OperationType'
import type { AxiosResponse } from 'axios'

export const operationApi = {
  getOperations: async (): Promise<ApiResponse<IOperation[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IOperation[]>> =
        await axiosInstance.get('/operations')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 10: `src/api/rate.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IProductOperationRate } from '@/types/RateType'
import type { AxiosResponse } from 'axios'

export const rateApi = {
  getRates: async (
    productCode: string,
  ): Promise<ApiResponse<IProductOperationRate[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IProductOperationRate[]>> =
        await axiosInstance.get('/product-operation-rates', {
          params: { product: productCode },
        })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 11: `src/api/auditLog.api.ts`**

```ts
import axiosInstance from '@/config/axios.config'
import type { ApiResponse } from '@/types'
import type { IAuditLog } from '@/types/AuditLogType'
import type { AxiosResponse } from 'axios'

export const auditLogApi = {
  getAuditLogs: async (): Promise<ApiResponse<IAuditLog[]>> => {
    try {
      const res: AxiosResponse<ApiResponse<IAuditLog[]>> =
        await axiosInstance.get('/audit-logs')
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}
```

- [ ] **Step 12: Verify lint**

Run: `pnpm exec eslint src/api`
Expected: no errors.

- [ ] **Step 13: Commit**

```bash
git add src/api
git commit -m "feat: add per-resource API modules"
```

---

## Task 6: react-query hooks

**Files:**
- Create: the 11 `src/hooks/use*.ts` files

Each hook unwraps `ApiResponse` and throws on `success === false` so react-query
captures the message. Mutations invalidate their list query.

- [ ] **Step 1: `src/hooks/useDepartments.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { departmentApi } from '@/api/department.api'
import type {
  ICreateDepartment,
  IDepartment,
  IUpdateDepartment,
} from '@/types/DepartmentType'

const KEY = ['departments'] as const

export function useDepartments() {
  return useQuery<IDepartment[]>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await departmentApi.getDepartments()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateDepartment) =>
      departmentApi.createDepartment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; data: IUpdateDepartment }) =>
      departmentApi.updateDepartment(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => departmentApi.deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
```

- [ ] **Step 2: `src/hooks/useEmployees.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeeApi } from '@/api/employee.api'
import type {
  ICreateEmployee,
  IEmployee,
  IUpdateEmployee,
} from '@/types/EmployeeType'

const KEY = ['employees'] as const

export function useEmployees() {
  return useQuery<IEmployee[]>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await employeeApi.getEmployees()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateEmployee) => employeeApi.createEmployee(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; data: IUpdateEmployee }) =>
      employeeApi.updateEmployee(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
```

- [ ] **Step 3: `src/hooks/useAccounts.ts`** (paged)

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountApi } from '@/api/account.api'
import type {
  IAccount,
  IAccountFilter,
  ICreateAccount,
  IUpdateAccount,
} from '@/types/AccountType'
import type { PagingResponse } from '@/types'

const KEY = ['accounts'] as const

export function useAccounts(filter?: IAccountFilter) {
  return useQuery<PagingResponse<IAccount>>({
    queryKey: [...KEY, filter] as const,
    queryFn: async () => {
      const res = await accountApi.getAccounts(filter)
      if (!res.success) throw new Error(res.message)
      return res.data ?? { items: [], total: 0, page: 1, pageSize: 20 }
    },
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateAccount) => accountApi.createAccount(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; data: IUpdateAccount }) =>
      accountApi.updateAccount(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountApi.deleteAccount(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
```

- [ ] **Step 4: `src/hooks/useRoles.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { roleApi } from '@/api/role.api'
import type { ICreateRole, IRole, IUpdateRole } from '@/types/RoleType'

const KEY = ['roles'] as const

export function useRoles() {
  return useQuery<IRole[]>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await roleApi.getRoles()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateRole) => roleApi.createRole(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; data: IUpdateRole }) =>
      roleApi.updateRole(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
```

- [ ] **Step 5: `src/hooks/usePermissions.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { permissionApi } from '@/api/permission.api'
import type { IPermissionGroup } from '@/types/PermissionType'

export function usePermissionGroups() {
  return useQuery<IPermissionGroup[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await permissionApi.getPermissions()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}
```

- [ ] **Step 6: `src/hooks/useAttendances.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '@/api/attendance.api'
import type { IAttendanceRow, ICreateAttendance } from '@/types/AttendanceType'

export function useAttendances(month: string) {
  return useQuery<IAttendanceRow[]>({
    queryKey: ['attendances', month],
    queryFn: async () => {
      const res = await attendanceApi.getAttendances(month)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useCreateAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateAttendance) =>
      attendanceApi.createAttendance(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['attendances'] }),
  })
}
```

- [ ] **Step 7: `src/hooks/usePayroll.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { payrollApi } from '@/api/payroll.api'
import type { IPayrollPeriod, IPayrollRow } from '@/types/PayrollType'

const PERIODS_KEY = ['payroll-periods'] as const

export function usePayrollPeriods() {
  return useQuery<IPayrollPeriod[]>({
    queryKey: PERIODS_KEY,
    queryFn: async () => {
      const res = await payrollApi.getPeriods()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function usePayrollRows(periodId: string | null) {
  return useQuery<IPayrollRow[]>({
    queryKey: ['payroll', periodId],
    enabled: !!periodId,
    queryFn: async () => {
      const res = await payrollApi.getPayroll(periodId as string)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}

export function useLockPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payrollApi.lockPeriod(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PERIODS_KEY }),
  })
}

export function useMarkPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payrollApi.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PERIODS_KEY }),
  })
}

export function useGeneratePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => payrollApi.generate(periodId),
    onSuccess: (_data, periodId) =>
      qc.invalidateQueries({ queryKey: ['payroll', periodId] }),
  })
}
```

- [ ] **Step 8: `src/hooks/useProducts.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { productApi } from '@/api/product.api'
import type { IProduct } from '@/types/ProductType'

export function useProducts() {
  return useQuery<IProduct[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productApi.getProducts()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}
```

- [ ] **Step 9: `src/hooks/useOperations.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { operationApi } from '@/api/operation.api'
import type { IOperation } from '@/types/OperationType'

export function useOperations() {
  return useQuery<IOperation[]>({
    queryKey: ['operations'],
    queryFn: async () => {
      const res = await operationApi.getOperations()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}
```

- [ ] **Step 10: `src/hooks/useRates.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { rateApi } from '@/api/rate.api'
import type { IProductOperationRate } from '@/types/RateType'

export function useProductRates(productCode: string) {
  return useQuery<IProductOperationRate[]>({
    queryKey: ['rates', productCode],
    queryFn: async () => {
      const res = await rateApi.getRates(productCode)
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}
```

- [ ] **Step 11: `src/hooks/useAuditLogs.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { auditLogApi } from '@/api/auditLog.api'
import type { IAuditLog } from '@/types/AuditLogType'

export function useAuditLogs() {
  return useQuery<IAuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await auditLogApi.getAuditLogs()
      if (!res.success) throw new Error(res.message)
      return res.data ?? []
    },
  })
}
```

- [ ] **Step 12: Verify lint**

Run: `pnpm exec eslint src/hooks`
Expected: no errors.

- [ ] **Step 13: Commit**

```bash
git add src/hooks
git commit -m "feat: add react-query hooks per resource"
```

---

## Task 7: sonner toast integration + /403 page + App wiring

**Files:**
- Create: `src/screens/forbidden.tsx`
- Modify: `src/App.tsx`
- Delete: `src/components/ui/toast.tsx`

- [ ] **Step 1: Create `src/screens/forbidden.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ForbiddenScreen() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4 max-w-sm">
        <div className="inline-grid place-items-center size-14 rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">403 — Không có quyền</h1>
        <p className="text-sm text-muted-foreground">
          Bạn không có quyền truy cập tài nguyên này. Liên hệ quản trị viên nếu
          cần cấp quyền.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Về bảng điều khiển</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `src/App.tsx`** (drop ToastProvider, add Toaster + /403, `@/` imports)

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/components/auth-context'
import { AppShell } from '@/components/layout/app-shell'
import { ProtectedRoute } from '@/components/protected-route'
import { LoginScreen } from '@/screens/login'
import { ForbiddenScreen } from '@/screens/forbidden'
import { DashboardScreen } from '@/screens/dashboard'
import { DepartmentsScreen } from '@/screens/departments'
import { EmployeesScreen } from '@/screens/employees'
import { AttendancesScreen } from '@/screens/attendances'
import { SalaryPeriodsScreen } from '@/screens/salary-periods'
import { PayrollRunsScreen } from '@/screens/payroll-runs'
import { ReportsScreen } from '@/screens/reports'
import { ProductsScreen } from '@/screens/products'
import { OperationsScreen } from '@/screens/operations'
import { RatesScreen } from '@/screens/rates'
import { AccountsScreen } from '@/screens/accounts'
import { RolesScreen } from '@/screens/roles'
import { AuditLogsScreen } from '@/screens/audit-logs'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster richColors position="bottom-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/403" element={<ForbiddenScreen />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardScreen />} />
              <Route
                path="/departments"
                element={
                  <ProtectedRoute perms={['hr.departments.manage', 'hr.departments.read']}>
                    <DepartmentsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <ProtectedRoute perms={['hr.employees.manage', 'hr.employees.read']}>
                    <EmployeesScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendances"
                element={
                  <ProtectedRoute perms={['attendance.read']}>
                    <AttendancesScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/salary-periods"
                element={
                  <ProtectedRoute perms={['payroll.periods.read']}>
                    <SalaryPeriodsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll-runs"
                element={
                  <ProtectedRoute perms={['payroll.read']}>
                    <PayrollRunsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute perms={['payroll.reports.read']}>
                    <ReportsScreen />
                  </ProtectedRoute>
                }
              />
              <Route path="/products" element={<ProductsScreen />} />
              <Route path="/operations" element={<OperationsScreen />} />
              <Route path="/rates" element={<RatesScreen />} />
              <Route
                path="/system/accounts"
                element={
                  <ProtectedRoute perms={['accounts.manage', 'accounts.read']}>
                    <AccountsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/roles"
                element={
                  <ProtectedRoute perms={['roles.manage', 'roles.read']}>
                    <RolesScreen />
                  </ProtectedRoute>
                }
              />
              <Route path="/system/audit-logs" element={<AuditLogsScreen />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
```

- [ ] **Step 3: Delete the custom toast component**

```bash
git rm src/components/ui/toast.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/screens/forbidden.tsx
git commit -m "feat: sonner Toaster + /403 page, drop custom ToastProvider"
```

---

## Task 8: Rewire screens — sonner + new hooks

Each screen currently imports `useToast` from `../components/ui/toast` and data
hooks/mutations from `../api/resources`. Convert each:
- Replace `import { useToast } ...` with `import { toast } from 'sonner'`.
- Remove the `const toast = useToast()` line.
- Replace `toast({ title: 'X', desc: 'Y' })` → `toast.success('X', { description: 'Y' })`.
- Replace `toast({ kind: 'error', title: 'X', desc: 'Y' })` → `toast.error('X', { description: 'Y' })`.
- Replace data hook imports from `../api/resources` with the new `@/hooks/*` hooks.
- Replace mutation usage with the new mutation hooks (signatures below).

Work one screen per step; verify lint after each.

- [ ] **Step 1: `src/screens/dashboard.tsx`**

Change the import `import { useAuditLogs, useDepartments } from '../api/resources'` to:
```tsx
import { useDepartments } from '@/hooks/useDepartments'
import { useAuditLogs } from '@/hooks/useAuditLogs'
```
No toast usage here. Verify: `pnpm exec eslint src/screens/dashboard.tsx`.

- [ ] **Step 2: `src/screens/departments.tsx`**

Replace the resources import block:
```tsx
import {
  departmentMutations,
  useApiMutation,
  useDepartments,
  useEmployees,
  QK,
} from '../api/resources'
```
with:
```tsx
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
```
Replace `import { useToast } from '../components/ui/toast'` with `import { toast } from 'sonner'` and delete the `const toast = useToast()` line.

Replace the three mutation declarations:
```tsx
  const createMut = useApiMutation(... )
  const updateMut = useApiMutation(... )
  const removeMut = useApiMutation(... )
```
with:
```tsx
  const createMut = useCreateDepartment()
  const updateMut = useUpdateDepartment()
  const removeMut = useDeleteDepartment()
```

In `save()`, change the update call `await updateMut.mutateAsync({ id: editing.id, payload: editing })` to `await updateMut.mutateAsync({ id: editing.id, data: { code: editing.code, name: editing.name, status: editing.status, manager: editing.manager } })`, and the create call `await createMut.mutateAsync({ code: ..., name: ..., status: ..., manager: ... })` stays the same shape (object matches `ICreateDepartment`).

Change every `toast({ title: 'X', desc: y })` → `toast.success('X', { description: y })` and every `toast({ kind: 'error', title: 'X', desc: y })` → `toast.error('X', { description: y })`.

Verify: `pnpm exec eslint src/screens/departments.tsx`.

- [ ] **Step 3: `src/screens/employees.tsx`**

Replace the resources import block:
```tsx
import {
  QK,
  employeeMutations,
  useApiMutation,
  useDepartments,
  useEmployees,
  useOperations,
  useRoles,
} from '../api/resources'
```
with:
```tsx
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
} from '@/hooks/useEmployees'
import { useDepartments } from '@/hooks/useDepartments'
import { useOperations } from '@/hooks/useOperations'
import { useRoles } from '@/hooks/useRoles'
```
Replace `import { useToast } from '../components/ui/toast'` with `import { toast } from 'sonner'`; delete `const toast = useToast()`.

Replace the two mutation declarations with:
```tsx
  const createMut = useCreateEmployee()
  const updateMut = useUpdateEmployee()
```
In `onSave`, the create call `await createMut.mutateAsync(rest)` stays (rest matches `ICreateEmployee`); change the update call to `await updateMut.mutateAsync({ id: emp.id, data: emp })`.

Convert all `toast({...})` calls to `toast.success(...)` / `toast.error(...)` as in Step 2.

Verify: `pnpm exec eslint src/screens/employees.tsx`.

- [ ] **Step 4: `src/screens/attendances.tsx`**

Replace `import { useAttendances, useDepartments, useEmployees } from '../api/resources'` with:
```tsx
import { useAttendances } from '@/hooks/useAttendances'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
```
Replace `import { useToast } from '../components/ui/toast'` with `import { toast } from 'sonner'`; delete `const toast = useToast()`. Change `toast({ title: 'Đã lưu chấm công' })` → `toast.success('Đã lưu chấm công')`.

Verify: `pnpm exec eslint src/screens/attendances.tsx`.

- [ ] **Step 5: `src/screens/salary-periods.tsx`**

Replace the resources import block:
```tsx
import {
  QK,
  periodMutations,
  useApiMutation,
  usePayrollPeriods,
} from '../api/resources'
```
with:
```tsx
import {
  usePayrollPeriods,
  useLockPeriod,
  useMarkPaid,
} from '@/hooks/usePayroll'
```
Replace `import { StatCard } from './dashboard'` → `import { StatCard } from '@/screens/dashboard'` (optional; relative import also fine). Replace `import { useToast } from '../components/ui/toast'` with `import { toast } from 'sonner'`; delete `const toast = useToast()`.

Replace mutation declarations:
```tsx
  const lockMut = useLockPeriod()
  const paidMut = useMarkPaid()
```
Convert `toast({...})` → `toast.success(...)`.

Verify: `pnpm exec eslint src/screens/salary-periods.tsx`.

- [ ] **Step 6: `src/screens/payroll-runs.tsx`**

Replace the resources import block:
```tsx
import {
  QK,
  payrollMutations,
  useApiMutation,
  usePayrollPeriods,
  usePayrollRows,
} from '../api/resources'
```
with:
```tsx
import {
  usePayrollPeriods,
  usePayrollRows,
  useGeneratePayroll,
} from '@/hooks/usePayroll'
```
Replace `import { useToast } from '../components/ui/toast'` with `import { toast } from 'sonner'`; delete `const toast = useToast()`. Replace the generate mutation declaration with `const generateMut = useGeneratePayroll()`. Convert all `toast({...})` → `toast.success(...)`.

Verify: `pnpm exec eslint src/screens/payroll-runs.tsx`.

- [ ] **Step 7: `src/screens/reports.tsx`**

Replace `import { useDepartments, usePayrollPeriods, usePayrollRows } from '../api/resources'` with:
```tsx
import { useDepartments } from '@/hooks/useDepartments'
import { usePayrollPeriods, usePayrollRows } from '@/hooks/usePayroll'
```
No toast usage. Verify: `pnpm exec eslint src/screens/reports.tsx`.

- [ ] **Step 8: `src/screens/products.tsx`**

Replace `import { useProducts } from '../api/resources'` → `import { useProducts } from '@/hooks/useProducts'`. No toast. Verify lint.

- [ ] **Step 9: `src/screens/operations.tsx`**

Replace `import { useOperations } from '../api/resources'` → `import { useOperations } from '@/hooks/useOperations'`. No toast. Verify lint.

- [ ] **Step 10: `src/screens/rates.tsx`**

Replace `import { useOperations, useProducts, useProductRates } from '../api/resources'` with:
```tsx
import { useOperations } from '@/hooks/useOperations'
import { useProducts } from '@/hooks/useProducts'
import { useProductRates } from '@/hooks/useRates'
```
Replace `import { useToast } from '../components/ui/toast'` with `import { toast } from 'sonner'`; delete `const toast = useToast()`. Change `toast({ title: 'Đã cập nhật đơn giá' })` → `toast.success('Đã cập nhật đơn giá')`.

Verify: `pnpm exec eslint src/screens/rates.tsx`.

- [ ] **Step 11: `src/screens/accounts.tsx`**

Replace `import { useAccounts, useDepartments, useEmployees, useRoles } from '../api/resources'` with:
```tsx
import { useAccounts } from '@/hooks/useAccounts'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import { useRoles } from '@/hooks/useRoles'
```
Because `useAccounts` now returns `PagingResponse<IAccount>`, change the list binding. Find:
```tsx
  const { data: list = [], isLoading, error } = useAccounts()
```
replace with:
```tsx
  const { data: paged, isLoading, error } = useAccounts()
  const list = paged?.items ?? []
```
Replace `import { useToast } from '../components/ui/toast'` with `import { toast } from 'sonner'`; delete `const toast = useToast()`. Convert `toast({...})` → `toast.success(...)`.

Verify: `pnpm exec eslint src/screens/accounts.tsx`.

- [ ] **Step 12: `src/screens/roles.tsx`**

Replace `import { usePermissionGroups, useRoles } from '../api/resources'` with:
```tsx
import { usePermissionGroups } from '@/hooks/usePermissions'
import { useRoles } from '@/hooks/useRoles'
```
Replace `import { useToast } from '../components/ui/toast'` with `import { toast } from 'sonner'`; delete `const toast = useToast()`. Convert `toast({...})` → `toast.success(...)`.

Verify: `pnpm exec eslint src/screens/roles.tsx`.

- [ ] **Step 13: `src/screens/audit-logs.tsx`**

Replace `import { useAccounts, useAuditLogs } from '../api/resources'` with:
```tsx
import { useAccounts } from '@/hooks/useAccounts'
import { useAuditLogs } from '@/hooks/useAuditLogs'
```
Since `useAccounts` is paged, change `const { data: accounts = [] } = useAccounts()` to:
```tsx
  const { data: pagedAccounts } = useAccounts()
  const accounts = pagedAccounts?.items ?? []
```
No toast usage. Verify lint.

- [ ] **Step 14: Commit**

```bash
git add src/screens
git commit -m "refactor: screens use react-query hooks + sonner toasts"
```

---

## Task 9: Delete dead code + full verification

**Files:**
- Delete: `src/lib/api.ts`, `src/api/resources.ts`, `src/data/mock.ts`

- [ ] **Step 1: Delete the obsolete data layer**

```bash
git rm src/lib/api.ts src/api/resources.ts src/data/mock.ts
```

- [ ] **Step 2: Grep for stragglers**

Run:
```bash
grep -rn "api/resources\|data/mock\|lib/api\|useToast\|VITE_USE_MOCKS\|API_BASE_URL" src
```
Expected: **no output**. If any line prints, fix that import/usage before proceeding (it points at a missed reference from Task 8).

- [ ] **Step 3: Full typecheck + build**

Run: `pnpm build`
Expected: `tsc -b` passes with no errors, then `vite build` writes `dist/`. If tsc reports an error, fix it (most likely a type mismatch between an `I*` type and a screen's local interface — align the screen to the `I*` type).

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: `ESLint: No issues found`.

- [ ] **Step 5: Dev smoke test**

Run: `pnpm dev` (background). Then verify in a browser at the printed URL:
1. `/login` renders; submit `admin` + real password.
2. Network tab: `POST /auth/login` returns token; `GET /auth/my-permissions` is sent **with** `Authorization: Bearer ...`.
3. Cookie `hr_access_token` is set; `localStorage['hr.auth']` holds roles + permissions.
4. Redirect to `/dashboard`; sidebar + data load.
5. Trigger a `403` (visit a route lacking permission, or hit a forbidden endpoint) → sonner error toast + redirect to `/403`.
6. Create a department → success toast + table refetches.

Stop the dev server when done (`pkill -f vite`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove prototype api/mock layer; build + lint clean"
```

---

## Self-Review Notes (author)

- **Spec coverage:** axios.config (Task 3), API modules (Task 5), types (Task 2), react-query hooks (Task 6), cookie+localStorage auth (Task 4), sonner (Tasks 7-8), `/403` (Task 7), mocks removed (Task 9), `@/` alias + env (Task 1), conditional `secure` cookie (Task 4 Step 2). All present.
- **Paging:** only `accounts` is paged; screens `accounts.tsx` and `audit-logs.tsx` adapted to `.items` (Task 8 Steps 11, 13).
- **Type names:** hooks use `{ id, data }` mutation vars consistently; screens updated to match (Task 8 Steps 2, 3).
- **Known follow-ups (out of scope):** backend list shapes assumed from `PROJECT_API_UI_FLOW.md`; if Swagger differs (e.g. employees also paged), adjust the corresponding `*Type`/`*.api.ts`/`use*` trio. Attendance/payroll row endpoints assume the prototype's nested `employee` object — confirm against Swagger during the dev smoke.

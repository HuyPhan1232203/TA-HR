# API Layer Refactor — Design

**Date:** 2026-05-23
**Status:** Approved (design); pending implementation plan

## Goal

Refactor the TA-HR data layer to the team's standard convention: a single
configured axios instance, per-resource API modules, `I`-prefixed type files,
react-query hooks on top, cookie-based auth, and `sonner` for toasts. Remove the
prototype mock layer entirely so the app talks only to the real backend.

## Decisions (locked)

| Topic | Decision |
| --- | --- |
| Refresh token | None. Backend issues only `accessToken`. On `401`, clear token cookie + redirect `/login`. No refresh-queue logic. |
| Token storage | Access token in a cookie via `js-cookie` (`VITE_ACCESS_TOKEN_KEY`). User `roles`/`permissions`/profile in `localStorage` under `hr.auth`. |
| List response shape | Mixed per endpoint. `accounts` returns `PagingResponse<IAccount>`; others return flat arrays (`IDepartment[]`, etc.) per `PROJECT_API_UI_FLOW.md`. Each module typed to its real shape. |
| Toast | Switch to `sonner`. Remove the custom `ToastProvider`/`useToast`. |
| Mocks | Removed entirely. No `VITE_USE_MOCKS`. Single real-backend path. |
| Routes | Keep `/login`; add a `/403` forbidden page. |
| Path prefix | API modules use paths **without** `/api` (e.g. `/accounts`). `baseURL = VITE_API_URL` carries the `/api/` suffix already configured in `.env`. |
| react-query hooks | Live in `src/hooks/` (one file per resource), wrapping the api modules. |

## Architecture

### Path alias

Add `@/` → `src` in both `vite.config.ts` (`resolve.alias`) and
`tsconfig.app.json` (`compilerOptions.paths`).

### Folder layout

```
src/
  config/
    axios.config.ts          # axios instance + request/response interceptors
  types/
    index.ts                 # ApiResponse<T>, PagingResponse<T>
    AuthType.ts              # ILoginRequest, ILoginResponse, IAuthSession
    AccountType.ts           # IAccount, ICreateAccount, IUpdateAccount, IAccountFilter
    DepartmentType.ts        # IDepartment, ICreateDepartment, IUpdateDepartment
    EmployeeType.ts          # IEmployee, ICreateEmployee, IUpdateEmployee, IEmployeeFilter
    RoleType.ts              # IRole, ICreateRole, IUpdateRole
    PermissionType.ts        # IPermission, IPermissionGroup
    AttendanceType.ts        # IAttendanceRow, IAttendanceCell, ICreateAttendance
    PayrollType.ts           # IPayrollPeriod, IPayrollRow, ICreatePeriod
    ProductType.ts           # IProduct
    OperationType.ts         # IOperation
    RateType.ts              # IProductOperationRate
    AuditLogType.ts          # IAuditLog
  api/
    auth.api.ts
    account.api.ts
    department.api.ts
    employee.api.ts
    role.api.ts
    permission.api.ts
    attendance.api.ts
    payroll.api.ts
    product.api.ts
    operation.api.ts
    rate.api.ts
    auditLog.api.ts
  hooks/
    useAccounts.ts           # query + mutation hooks per resource
    useDepartments.ts
    useEmployees.ts
    ... (one per resource)
```

### axios.config.ts

- `axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 30000, headers: { 'Content-Type': 'application/json' } })`.
- **Request interceptor:** read `Cookies.get(import.meta.env.VITE_ACCESS_TOKEN_KEY)`; if present set `config.headers.Authorization = 'Bearer ' + token`.
- **Response interceptor (success):** pass through.
- **Response interceptor (error):**
  - `403` → `toast.error(message ?? 'Bạn không có quyền truy cập tài nguyên này.')`; if not already on `/403`, `window.location.href = '/403'`. Reject.
  - `401` → remove the access-token cookie; redirect `window.location.href = '/login'`. Reject.
  - else reject.
- No `_retry`, `failedQueue`, `isRefreshing`, or `/auth/refresh` call.

### API modules

Follow the supplied template verbatim:

```ts
export const accountApi = {
  getAccounts: async (params?: IAccountFilter): Promise<ApiResponse<PagingResponse<IAccount>>> => {
    try {
      const res: AxiosResponse<ApiResponse<PagingResponse<IAccount>>> =
        await axiosInstance.get('/accounts', { params })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  // create / getById / update / delete / permissions ...
}
```

Endpoint map (paths relative to `baseURL`, no `/api`):

| Module | Methods → path |
| --- | --- |
| auth | `login` POST `/auth/login`; `myPermissions` GET `/auth/my-permissions`; `me` GET `/auth/me`; `changePassword` POST `/auth/change-password` |
| department | CRUD `/departments` |
| employee | CRUD `/employees` |
| account | CRUD `/accounts` (+ paging), permissions grant/revoke |
| role | CRUD `/roles` |
| permission | GET `/permissions` |
| attendance | GET/POST/DELETE `/attendances` |
| payroll | GET `/payroll-periods`, POST `/payroll-periods/{id}/lock`, `/payroll-periods/{id}/paid`; POST `/payrolls/generate`, GET `/payrolls/{periodId}`, POST `/payrolls/{payrollId}/confirm`, `/payrolls/{payrollId}/items` |
| product | CRUD `/products` |
| operation | CRUD `/operations` |
| rate | CRUD `/product-operation-rates` |
| auditLog | GET `/audit-logs` |

### Types

`src/types/index.ts`:

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

Per-resource files export `I`-prefixed interfaces: the entity plus
`ICreate*`, `IUpdate*`, and `I*Filter` variants where the module needs them.

### Auth flow

1. `authApi.login({ username, password })` → POST `/auth/login` → `ILoginResponse` (`accessToken`, `accountId`, `username`, `fullName`, `employeeId`, `roles`).
2. Set the access-token cookie. **`secure` must be conditional** — the dev backend is plain HTTP, and a `secure` cookie is never sent over HTTP:
   `Cookies.set(KEY, accessToken, { expires: 7, secure: location.protocol === 'https:', sameSite: 'strict' })`.
3. `authApi.myPermissions()` → GET `/auth/my-permissions` → `string[]`. Token is attached by the request interceptor (cookie is now set).
4. Persist `{ accountId, username, fullName, employeeId, roles, permissions }` to `localStorage['hr.auth']`.
5. Logout: remove cookie + clear `hr.auth`.

`AuthProvider` reads `hr.auth` on load for routing/permission gates; the cookie
is the source of truth for the bearer token. `permissions.ts` helper unchanged.

### react-query hooks

Each `src/hooks/use<Resource>.ts` exposes:

- Query hooks: `useAccounts(filter)`, `useAccount(id)`, etc., calling the api module in `queryFn`.
- Mutation hooks: `useCreateAccount()`, `useUpdateAccount()`, `useDeleteAccount()`, returning `useMutation` with `onSuccess` → `queryClient.invalidateQueries`.

Screens import these hooks; no screen imports axios or an api module directly.

### Toast (sonner)

- Install `sonner`. Render `<Toaster richColors position="bottom-right" />` once at the app root.
- Replace every `const toast = useToast()` + `toast({ title, desc, kind })` with `import { toast } from 'sonner'` and `toast.success(title, { description })` / `toast.error(...)`.
- Delete `src/components/ui/toast.tsx`. Remove `ToastProvider` from `App.tsx`.
- The 403 path in the interceptor uses the same `sonner` `toast.error`.

### `/403` page

New `src/screens/forbidden.tsx` (simple centered Empty-style message). Route
`/403` outside the protected shell. In-app permission denials keep the existing
`ProtectedRoute` inline message; the `/403` redirect is for interceptor-level 403s.

## Removed

- `src/lib/api.ts` (replaced by `config/axios.config.ts` + api modules)
- `src/api/resources.ts` (replaced by `api/*.api.ts` + `hooks/*`)
- `src/data/mock.ts` and all mock usage
- `VITE_USE_MOCKS` env var and branching
- `src/components/ui/toast.tsx` and `ToastProvider`

`src/lib/auth-storage.ts` is retained (localStorage session) but the token field
moves to the cookie; `AuthSession` keeps user/roles/permissions only.

## Env

```
VITE_API_URL=http://100.85.237.107:8088/api/   # unchanged; baseURL carries /api
VITE_ACCESS_TOKEN_KEY=hr_access_token
```

## Error handling

- Network/non-2xx: api module logs + rethrows; react-query surfaces `error` to `QueryState`.
- `401`/`403`: handled centrally in the interceptor (redirect + toast); not duplicated per screen.
- Form validation: client-side before mutation, unchanged.

## Testing / verification

No test runner configured. Verification = `pnpm build` (tsc) + `pnpm lint` clean,
plus `pnpm dev` smoke: login → token cookie set → permissions loaded → a CRUD
round-trip (e.g. create department) invalidates and refetches.

## Out of scope

- Server-side paging UI wiring beyond `accounts` (other lists stay client-paged).
- Refresh-token support (backend has none).
- Route renaming to Vietnamese.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiSend } from '../lib/api'
import {
  ACCOUNTS,
  AUDIT_LOGS,
  DEPARTMENTS,
  EMPLOYEES,
  OPERATIONS,
  PAYROLL_PERIODS,
  PERMISSION_GROUPS,
  PRODUCTS,
  PROD_OP_RATES,
  ROLES,
  genAttendance,
  genPayrollRows,
} from '../data/mock'
import type {
  Account,
  AttendanceRow,
  AuditLog,
  Department,
  Employee,
  Operation,
  PayrollPeriod,
  PayrollRow,
  PermissionGroup,
  Product,
  ProductOperationRate,
  Role,
} from '../types/domain'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

function mockOr<T>(mock: () => T, fetcher: () => Promise<T>): () => Promise<T> {
  if (USE_MOCKS) return () => Promise.resolve(mock())
  return fetcher
}

export const QK = {
  departments: ['departments'] as const,
  employees: ['employees'] as const,
  accounts: ['accounts'] as const,
  roles: ['roles'] as const,
  permissions: ['permissions'] as const,
  attendances: (month: string) => ['attendances', month] as const,
  periods: ['payroll-periods'] as const,
  payroll: (periodId: string) => ['payroll', periodId] as const,
  products: ['products'] as const,
  operations: ['operations'] as const,
  rates: (productCode: string) => ['rates', productCode] as const,
  auditLogs: ['audit-logs'] as const,
}

export const useDepartments = () =>
  useQuery<Department[]>({
    queryKey: QK.departments,
    queryFn: mockOr(
      () => DEPARTMENTS,
      () => apiGet<Department[]>('/api/departments', 'Không thể tải phòng ban'),
    ),
  })

export const useEmployees = () =>
  useQuery<Employee[]>({
    queryKey: QK.employees,
    queryFn: mockOr(
      () => EMPLOYEES,
      () => apiGet<Employee[]>('/api/employees', 'Không thể tải nhân viên'),
    ),
  })

export const useAccounts = () =>
  useQuery<Account[]>({
    queryKey: QK.accounts,
    queryFn: mockOr(
      () => ACCOUNTS,
      () => apiGet<Account[]>('/api/accounts', 'Không thể tải tài khoản'),
    ),
  })

export const useRoles = () =>
  useQuery<Role[]>({
    queryKey: QK.roles,
    queryFn: mockOr(
      () => ROLES,
      () => apiGet<Role[]>('/api/roles', 'Không thể tải vai trò'),
    ),
  })

export const usePermissionGroups = () =>
  useQuery<PermissionGroup[]>({
    queryKey: QK.permissions,
    queryFn: mockOr(
      () => PERMISSION_GROUPS,
      () => apiGet<PermissionGroup[]>('/api/permissions', 'Không thể tải quyền'),
    ),
  })

export const useAttendances = (month: string) =>
  useQuery<AttendanceRow[]>({
    queryKey: QK.attendances(month),
    queryFn: mockOr(
      () => genAttendance(),
      () =>
        apiGet<AttendanceRow[]>(
          `/api/attendances?month=${encodeURIComponent(month)}`,
          'Không thể tải chấm công',
        ),
    ),
  })

export const usePayrollPeriods = () =>
  useQuery<PayrollPeriod[]>({
    queryKey: QK.periods,
    queryFn: mockOr(
      () => PAYROLL_PERIODS,
      () =>
        apiGet<PayrollPeriod[]>(
          '/api/payroll-periods',
          'Không thể tải kỳ lương',
        ),
    ),
  })

export const usePayrollRows = (periodId: string | null) =>
  useQuery<PayrollRow[]>({
    queryKey: periodId ? QK.payroll(periodId) : ['payroll', 'none'],
    enabled: !!periodId,
    queryFn: mockOr(
      () => genPayrollRows(periodId ?? ''),
      () =>
        apiGet<PayrollRow[]>(
          `/api/payrolls/${periodId}`,
          'Không thể tải bảng lương',
        ),
    ),
  })

export const useProducts = () =>
  useQuery<Product[]>({
    queryKey: QK.products,
    queryFn: mockOr(
      () => PRODUCTS,
      () => apiGet<Product[]>('/api/products', 'Không thể tải sản phẩm'),
    ),
  })

export const useOperations = () =>
  useQuery<Operation[]>({
    queryKey: QK.operations,
    queryFn: mockOr(
      () => OPERATIONS,
      () => apiGet<Operation[]>('/api/operations', 'Không thể tải công đoạn'),
    ),
  })

export const useProductRates = (productCode: string) =>
  useQuery<ProductOperationRate[]>({
    queryKey: QK.rates(productCode),
    queryFn: mockOr(
      () => PROD_OP_RATES.filter((r) => r.product === productCode),
      () =>
        apiGet<ProductOperationRate[]>(
          `/api/product-operation-rates?product=${encodeURIComponent(productCode)}`,
          'Không thể tải đơn giá',
        ),
    ),
  })

export const useAuditLogs = () =>
  useQuery<AuditLog[]>({
    queryKey: QK.auditLogs,
    queryFn: mockOr(
      () => AUDIT_LOGS,
      () =>
        apiGet<AuditLog[]>('/api/audit-logs', 'Không thể tải nhật ký'),
    ),
  })

interface MutationOpts<T> {
  invalidate?: ReadonlyArray<ReadonlyArray<unknown>>
  fallbackMessage?: string
  onSuccess?: (data: T) => void
}

export function useApiMutation<TData, TVars>(
  fn: (vars: TVars) => Promise<TData>,
  opts: MutationOpts<TData> = {},
) {
  const qc = useQueryClient()
  return useMutation<TData, Error, TVars>({
    mutationFn: fn,
    onSuccess: (data) => {
      opts.invalidate?.forEach((key) =>
        qc.invalidateQueries({ queryKey: [...key] }),
      )
      opts.onSuccess?.(data)
    },
  })
}

export const departmentMutations = {
  create: (payload: Omit<Department, 'id' | 'headcount'>) =>
    USE_MOCKS
      ? Promise.resolve({ ...payload, id: `d${Date.now()}`, headcount: 0 } as Department)
      : apiSend<Department>('/api/departments', 'POST', payload, 'Không thể tạo phòng ban'),
  update: (id: string, payload: Partial<Department>) =>
    USE_MOCKS
      ? Promise.resolve({ ...payload, id } as Department)
      : apiSend<Department>(
          `/api/departments/${id}`,
          'PUT',
          payload,
          'Không thể cập nhật phòng ban',
        ),
  remove: (id: string) =>
    USE_MOCKS
      ? Promise.resolve()
      : apiSend<void>(
          `/api/departments/${id}`,
          'DELETE',
          undefined,
          'Không thể xóa phòng ban',
        ),
}

export const employeeMutations = {
  create: (payload: Omit<Employee, 'id'>) =>
    USE_MOCKS
      ? Promise.resolve({ ...payload, id: `e${Date.now()}` } as Employee)
      : apiSend<Employee>('/api/employees', 'POST', payload, 'Không thể tạo nhân viên'),
  update: (id: string, payload: Partial<Employee>) =>
    USE_MOCKS
      ? Promise.resolve({ ...payload, id } as Employee)
      : apiSend<Employee>(
          `/api/employees/${id}`,
          'PUT',
          payload,
          'Không thể cập nhật nhân viên',
        ),
}

export const periodMutations = {
  lock: (id: string) =>
    USE_MOCKS
      ? Promise.resolve()
      : apiSend<void>(
          `/api/payroll-periods/${id}/lock`,
          'POST',
          undefined,
          'Không thể khóa kỳ lương',
        ),
  paid: (id: string) =>
    USE_MOCKS
      ? Promise.resolve()
      : apiSend<void>(
          `/api/payroll-periods/${id}/paid`,
          'POST',
          undefined,
          'Không thể đánh dấu đã trả',
        ),
}

export const payrollMutations = {
  generate: (periodId: string) =>
    USE_MOCKS
      ? Promise.resolve()
      : apiSend<void>(
          '/api/payrolls/generate',
          'POST',
          { periodId },
          'Không thể tạo bảng lương',
        ),
}

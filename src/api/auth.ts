import { apiGet, apiSend } from '../lib/api'
import type { AuthSession } from '../lib/auth-storage'

interface LoginResponse {
  accessToken: string
  accountId: string
  username: string
  fullName: string
  displayName?: string
  employeeId?: string
  roles: string[]
}

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export async function loginRequest(
  username: string,
  password: string,
): Promise<AuthSession> {
  if (USE_MOCKS) {
    return {
      accessToken: 'mock-token',
      accountId: 'a2',
      username,
      fullName: 'Trần Thu Hương',
      displayName: 'Trần Thu Hương',
      employeeId: 'e2',
      roles: ['hr_manager'],
      permissions: [
        'hr.departments.manage',
        'hr.departments.read',
        'hr.employees.manage',
        'hr.employees.read',
        'attendance.read',
        'attendance.manage',
        'payroll.read',
        'payroll.periods.read',
        'payroll.periods.manage',
        'payroll.generate',
        'payroll.confirm',
        'payroll.reports.read',
        'accounts.manage',
        'accounts.read',
        'roles.manage',
        'roles.read',
        'production.products.manage',
        'production.operations.manage',
        'production.rates.manage',
      ],
    }
  }

  const login = await apiSend<LoginResponse>(
    '/api/auth/login',
    'POST',
    { username, password },
    'Đăng nhập không thành công',
  )

  // Session not persisted yet, so the request interceptor can't attach the
  // bearer token. Pass it explicitly for the follow-up permissions call.
  const permissions = await apiGet<string[]>(
    '/api/auth/my-permissions',
    'Không thể tải danh sách quyền',
    { headers: { Authorization: `Bearer ${login.accessToken}` } },
  )

  return { ...login, permissions }
}

export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (USE_MOCKS) return
  await apiSend(
    '/api/auth/change-password',
    'POST',
    { currentPassword, newPassword },
    'Đổi mật khẩu không thành công',
  )
}

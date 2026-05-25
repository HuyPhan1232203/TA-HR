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
import { SalaryRatesScreen } from '@/screens/salary-rates'
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
                path="/salary-rates"
                element={
                  <ProtectedRoute perms={['hr.employees.manage', 'hr.employees.read']}>
                    <SalaryRatesScreen />
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

import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/components/auth-context'
import { AppShell } from '@/components/layout/app-shell'
import { ProtectedRoute } from '@/components/protected-route'
import { ROUTE_ACCESS } from '@/components/layout/nav'
import { LoginScreen } from '@/screens/login'
import { ForbiddenScreen } from '@/screens/forbidden'
import { DashboardScreen } from '@/screens/dashboard'
import { DepartmentsScreen } from '@/screens/departments'
import { EmployeesScreen } from '@/screens/employees'
import { EmployeeDetailScreen } from '@/screens/employee-detail'
import { AttendancesScreen } from '@/screens/attendances'
import { MyAttendanceScreen } from '@/screens/my-attendance'
import { ShiftConfigsScreen } from '@/screens/shift-configs'
import { HolidaysScreen } from '@/screens/holidays'
import { SalaryPeriodsScreen } from '@/screens/salary-periods'
import { PayrollRunsScreen } from '@/screens/payroll-runs'
import { OvertimeApprovalsScreen } from '@/screens/overtime-approvals'
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
                  <ProtectedRoute access={ROUTE_ACCESS['/departments']}>
                    <DepartmentsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/employees']}>
                    <EmployeesScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees/:id"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/employees']}>
                    <EmployeeDetailScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendances"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/attendances']}>
                    <AttendancesScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shift-configs"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/shift-configs']}>
                    <ShiftConfigsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/holidays"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/holidays']}>
                    <HolidaysScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-attendance"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/my-attendance']}>
                    <MyAttendanceScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/salary-rates"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/salary-rates']}>
                    <SalaryRatesScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/salary-periods"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/salary-periods']}>
                    <SalaryPeriodsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll-runs"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/payroll-runs']}>
                    <PayrollRunsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/overtime-approvals"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/overtime-approvals']}>
                    <OvertimeApprovalsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/reports']}>
                    <ReportsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/accounts"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/system/accounts']}>
                    <AccountsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/roles"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/system/roles']}>
                    <RolesScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system/audit-logs"
                element={
                  <ProtectedRoute access={ROUTE_ACCESS['/system/audit-logs']}>
                    <AuditLogsScreen />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App

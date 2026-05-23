export type EmployeeStatus = 'Active' | 'Onleave' | 'Resigned'
export type DepartmentStatus = 'Active' | 'Inactive'
export type AccountStatus = 'Active' | 'Disabled'
export type PeriodStatus = 'Open' | 'Locked' | 'Paid'
export type ProductStatus = 'Active' | 'Inactive'
export type PayrollRowStatus = 'Draft' | 'Confirmed'
export type AttendanceKind = 'work' | 'ot' | 'leave' | 'off'

export interface Department {
  id: string
  code: string
  name: string
  status: DepartmentStatus
  headcount: number
  manager: string
}

export interface Employee {
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

export interface Role {
  id: string
  code: string
  name: string
  description: string
  accounts: number
}

export interface PermissionGroup {
  module: string
  label: string
  perms: string[]
}

export interface Account {
  id: string
  username: string
  employee: string | null
  fullName: string
  roles: string[]
  status: AccountStatus
  lastLogin: string
}

export interface PayrollPeriod {
  id: string
  name: string
  code: string
  startDate: string
  endDate: string
  status: PeriodStatus
  employees: number
  totalAmount: number | null
}

export interface Product {
  id: string
  code: string
  name: string
  status: ProductStatus
  operations: number
  lastUpdated: string
}

export interface Operation {
  id: string
  code: string
  name: string
  unit: string
  category: string
}

export interface ProductOperationRate {
  id: string
  product: string
  operation: string
  rate: number
  effectiveFrom: string
}

export interface AuditLog {
  id: string
  at: string
  actor: string
  action: string
  target: string
  ip: string
}

export interface AttendanceCell {
  d: number
  kind: AttendanceKind
  hours?: number
}

export interface AttendanceRow {
  employee: Employee
  cells: AttendanceCell[]
}

export interface PayrollRow {
  employee: Employee
  workDays: number
  ot: number
  piecework: number
  allowance: number
  deductions: number
  gross: number
  net: number
  status: PayrollRowStatus
}

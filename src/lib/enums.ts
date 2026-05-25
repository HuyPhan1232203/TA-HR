// Backend serializes enums as 1-based integers; the app uses readable string
// names. These ordered arrays mirror the C# enum declaration order so the
// integer value equals (index + 1). `satisfies` guards each array against the
// canonical type. Conversion happens at the api boundary (see src/api/*).
import type { AccountStatus } from '@/types/AccountType'
import type { AttendanceStatus } from '@/types/AttendanceType'
import type { EmployeeStatus, SalaryCalculationType } from '@/types/EmployeeType'
import type {
  PayrollItemType,
  PayrollStatus,
  PeriodStatus,
} from '@/types/PayrollType'

export const SALARY_CALC_TYPES = [
  'FixedMonthly',
  'DailyWage',
  'HourlyWage',
  'ProductBased',
  'Mixed',
] as const satisfies readonly SalaryCalculationType[]

export const EMPLOYEE_STATUSES = [
  'Active',
  'Inactive',
  'Resigned',
] as const satisfies readonly EmployeeStatus[]

export const ACCOUNT_STATUSES = [
  'Active',
  'Locked',
] as const satisfies readonly AccountStatus[]

export const ATTENDANCE_STATUSES = [
  'Draft',
  'Confirmed',
] as const satisfies readonly AttendanceStatus[]

export const PERIOD_STATUSES = [
  'Draft',
  'Open',
  'Locked',
  'Paid',
] as const satisfies readonly PeriodStatus[]

export const PAYROLL_STATUSES = [
  'Draft',
  'Calculated',
  'Confirmed',
  'Locked',
  'Paid',
  'Cancelled',
] as const satisfies readonly PayrollStatus[]

export const PAYROLL_ITEM_TYPES = [
  'AttendanceSalary',
  'ProductSalary',
  'OvertimeSalary',
  'Allowance',
  'Bonus',
  'Deduction',
  'Insurance',
  'Tax',
] as const satisfies readonly PayrollItemType[]

// Wire value (1-based int, or already-a-name string) -> string name.
// Tolerant: if the backend ever sends names again, pass them through.
export function enumName<T extends readonly string[]>(
  arr: T,
  v: unknown,
): T[number] {
  if (typeof v === 'number') return arr[v - 1]
  return v as T[number]
}

// String name (or number) -> 1-based int for the wire.
export function enumNum<T extends readonly string[]>(
  arr: T,
  v: unknown,
): number {
  if (typeof v === 'number') return v
  const i = arr.indexOf(v as string)
  return i >= 0 ? i + 1 : Number(v)
}

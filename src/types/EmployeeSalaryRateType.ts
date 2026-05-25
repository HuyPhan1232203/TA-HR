import type { SalaryCalculationType } from './EmployeeType'

// GET /api/employee-salary-rates/{employeeId}
export interface IEmployeeSalaryRate {
  id: string
  employeeId: string
  calculationType: SalaryCalculationType
  monthlySalary: number
  dailyRate: number
  hourlyRate: number
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
}

// POST /api/employee-salary-rates
export interface ICreateEmployeeSalaryRate {
  employeeId: string
  calculationType: SalaryCalculationType
  monthlySalary: number
  dailyRate: number
  hourlyRate: number
  effectiveFrom: string
  effectiveTo?: string | null
}

// PUT /api/employee-salary-rates/{id}
export interface IUpdateEmployeeSalaryRate {
  employeeId?: string
  calculationType?: SalaryCalculationType
  monthlySalary?: number
  dailyRate?: number
  hourlyRate?: number
  effectiveFrom?: string
  effectiveTo?: string | null
  isActive?: boolean
}

// Holiday calendar (guide §6). `isPaidLeave` affects standard working days
// of a payroll period.

export interface IHoliday {
  id: string
  name: string
  date: string // yyyy-MM-dd
  isPaidLeave: boolean
}

// POST /api/holidays
export interface ICreateHoliday {
  name: string
  date: string
  isPaidLeave: boolean
}

// GET /api/holidays?fromDate=&toDate=
export interface IHolidayFilter {
  fromDate?: string
  toDate?: string
}

import type {
  Account,
  AttendanceCell,
  AttendanceKind,
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

export const DEPARTMENTS: Department[] = [
  { id: 'd1', code: 'HR', name: 'Nhân sự', status: 'Active', headcount: 8, manager: 'Trần Thu Hương' },
  { id: 'd2', code: 'ENG', name: 'Kỹ thuật', status: 'Active', headcount: 42, manager: 'Phạm Quốc Bảo' },
  { id: 'd3', code: 'PROD', name: 'Sản xuất', status: 'Active', headcount: 124, manager: 'Nguyễn Văn Hoàng' },
  { id: 'd4', code: 'QA', name: 'Kiểm định chất lượng', status: 'Active', headcount: 18, manager: 'Lê Thị Mai' },
  { id: 'd5', code: 'FIN', name: 'Tài chính - Kế toán', status: 'Active', headcount: 12, manager: 'Vũ Anh Tuấn' },
  { id: 'd6', code: 'OPS', name: 'Vận hành', status: 'Inactive', headcount: 0, manager: '—' },
]

export const EMPLOYEES: Employee[] = [
  { id: 'e1', code: 'NV001', name: 'Nguyễn Minh An', dept: 'ENG', role: 'Senior Developer', email: 'an.nm@ta-hr.vn', phone: '0905 234 198', status: 'Active', joinedAt: '2022-04-12', salary: 28_000_000 },
  { id: 'e2', code: 'NV002', name: 'Trần Thu Hương', dept: 'HR', role: 'HR Manager', email: 'huong.tt@ta-hr.vn', phone: '0912 884 220', status: 'Active', joinedAt: '2020-11-03', salary: 32_000_000 },
  { id: 'e3', code: 'NV003', name: 'Phạm Quốc Bảo', dept: 'ENG', role: 'Engineering Lead', email: 'bao.pq@ta-hr.vn', phone: '0987 661 533', status: 'Active', joinedAt: '2019-08-21', salary: 45_000_000 },
  { id: 'e4', code: 'NV004', name: 'Lê Thị Mai', dept: 'QA', role: 'QA Lead', email: 'mai.lt@ta-hr.vn', phone: '0934 712 998', status: 'Active', joinedAt: '2021-05-09', salary: 26_000_000 },
  { id: 'e5', code: 'NV005', name: 'Vũ Anh Tuấn', dept: 'FIN', role: 'Kế toán trưởng', email: 'tuan.va@ta-hr.vn', phone: '0944 235 887', status: 'Active', joinedAt: '2018-02-14', salary: 38_000_000 },
  { id: 'e6', code: 'NV006', name: 'Nguyễn Văn Hoàng', dept: 'PROD', role: 'Production Manager', email: 'hoang.nv@ta-hr.vn', phone: '0903 998 121', status: 'Active', joinedAt: '2017-06-30', salary: 36_000_000 },
  { id: 'e7', code: 'NV007', name: 'Đỗ Hải Linh', dept: 'PROD', role: 'Công nhân kỹ thuật', email: 'linh.dh@ta-hr.vn', phone: '0967 332 110', status: 'Active', joinedAt: '2023-01-15', salary: 9_500_000 },
  { id: 'e8', code: 'NV008', name: 'Hoàng Thị Lan', dept: 'PROD', role: 'Công nhân kỹ thuật', email: 'lan.ht@ta-hr.vn', phone: '0978 442 091', status: 'Active', joinedAt: '2023-03-04', salary: 9_000_000 },
  { id: 'e9', code: 'NV009', name: 'Bùi Đức Thắng', dept: 'PROD', role: 'Tổ trưởng sản xuất', email: 'thang.bd@ta-hr.vn', phone: '0911 554 223', status: 'Active', joinedAt: '2020-09-18', salary: 14_000_000 },
  { id: 'e10', code: 'NV010', name: 'Phan Mỹ Linh', dept: 'PROD', role: 'Công nhân kỹ thuật', email: 'linh.pm@ta-hr.vn', phone: '0902 661 887', status: 'Onleave', joinedAt: '2022-11-22', salary: 9_200_000 },
  { id: 'e11', code: 'NV011', name: 'Đặng Quang Huy', dept: 'ENG', role: 'Developer', email: 'huy.dq@ta-hr.vn', phone: '0966 200 188', status: 'Active', joinedAt: '2024-02-01', salary: 18_000_000 },
  { id: 'e12', code: 'NV012', name: 'Trịnh Thảo Nhi', dept: 'QA', role: 'QA Engineer', email: 'nhi.tt@ta-hr.vn', phone: '0913 778 401', status: 'Active', joinedAt: '2023-06-12', salary: 15_500_000 },
]

export const ROLES: Role[] = [
  { id: 'r1', code: 'admin', name: 'Quản trị hệ thống', description: 'Toàn quyền hệ thống', accounts: 2 },
  { id: 'r2', code: 'hr_manager', name: 'Quản lý nhân sự', description: 'Quản lý nhân viên, phòng ban', accounts: 3 },
  { id: 'r3', code: 'payroll_officer', name: 'Cán bộ tính lương', description: 'Tạo và xác nhận bảng lương', accounts: 4 },
  { id: 'r4', code: 'supervisor', name: 'Tổ trưởng sản xuất', description: 'Chấm công, sản lượng', accounts: 12 },
  { id: 'r5', code: 'employee', name: 'Nhân viên', description: 'Xem thông tin cá nhân', accounts: 192 },
]

export const PERMISSION_GROUPS: PermissionGroup[] = [
  { module: 'accounts', label: 'Tài khoản', perms: ['accounts.manage', 'accounts.read', 'accounts.assign-role'] },
  { module: 'roles', label: 'Vai trò', perms: ['roles.manage', 'roles.read'] },
  { module: 'hr.departments', label: 'Phòng ban', perms: ['hr.departments.manage', 'hr.departments.read'] },
  { module: 'hr.employees', label: 'Nhân viên', perms: ['hr.employees.manage', 'hr.employees.read'] },
  { module: 'attendance', label: 'Chấm công', perms: ['attendance.read', 'attendance.manage', 'attendance.approve'] },
  { module: 'production', label: 'Sản xuất', perms: ['production.products.manage', 'production.operations.manage', 'production.rates.manage'] },
  { module: 'payroll', label: 'Tính lương', perms: ['payroll.read', 'payroll.periods.read', 'payroll.periods.manage', 'payroll.generate', 'payroll.confirm', 'payroll.reports.read'] },
]

export const ACCOUNTS: Account[] = [
  { id: 'a1', username: 'admin', employee: null, fullName: 'Quản trị viên', roles: ['admin'], status: 'Active', lastLogin: '2026-05-22 09:14' },
  { id: 'a2', username: 'huong.tt', employee: 'e2', fullName: 'Trần Thu Hương', roles: ['hr_manager'], status: 'Active', lastLogin: '2026-05-22 08:42' },
  { id: 'a3', username: 'tuan.va', employee: 'e5', fullName: 'Vũ Anh Tuấn', roles: ['payroll_officer'], status: 'Active', lastLogin: '2026-05-21 17:55' },
  { id: 'a4', username: 'thang.bd', employee: 'e9', fullName: 'Bùi Đức Thắng', roles: ['supervisor'], status: 'Active', lastLogin: '2026-05-22 07:30' },
  { id: 'a5', username: 'an.nm', employee: 'e1', fullName: 'Nguyễn Minh An', roles: ['employee'], status: 'Active', lastLogin: '2026-05-20 19:12' },
  { id: 'a6', username: 'bao.pq', employee: 'e3', fullName: 'Phạm Quốc Bảo', roles: ['supervisor', 'employee'], status: 'Active', lastLogin: '2026-05-22 09:01' },
  { id: 'a7', username: 'mai.lt', employee: 'e4', fullName: 'Lê Thị Mai', roles: ['supervisor'], status: 'Disabled', lastLogin: '2026-04-30 14:22' },
]

export const PAYROLL_PERIODS: PayrollPeriod[] = [
  { id: 'p1', name: 'Kỳ lương tháng 05/2026', code: 'PR-2026-05', startDate: '2026-05-01', endDate: '2026-05-31', status: 'Open', employees: 196, totalAmount: null },
  { id: 'p2', name: 'Kỳ lương tháng 04/2026', code: 'PR-2026-04', startDate: '2026-04-01', endDate: '2026-04-30', status: 'Locked', employees: 194, totalAmount: 2_840_000_000 },
  { id: 'p3', name: 'Kỳ lương tháng 03/2026', code: 'PR-2026-03', startDate: '2026-03-01', endDate: '2026-03-31', status: 'Paid', employees: 192, totalAmount: 2_768_000_000 },
  { id: 'p4', name: 'Kỳ lương tháng 02/2026', code: 'PR-2026-02', startDate: '2026-02-01', endDate: '2026-02-29', status: 'Paid', employees: 190, totalAmount: 2_540_000_000 },
  { id: 'p5', name: 'Kỳ lương tháng 01/2026', code: 'PR-2026-01', startDate: '2026-01-01', endDate: '2026-01-31', status: 'Paid', employees: 188, totalAmount: 2_702_000_000 },
]

export const PRODUCTS: Product[] = [
  { id: 'pr1', code: 'SP-A001', name: 'Áo sơ mi nam dài tay', status: 'Active', operations: 8, lastUpdated: '2026-05-12' },
  { id: 'pr2', code: 'SP-A002', name: 'Áo sơ mi nam ngắn tay', status: 'Active', operations: 7, lastUpdated: '2026-05-12' },
  { id: 'pr3', code: 'SP-B001', name: 'Quần tây nam', status: 'Active', operations: 9, lastUpdated: '2026-05-10' },
  { id: 'pr4', code: 'SP-B002', name: 'Quần kaki nam', status: 'Active', operations: 9, lastUpdated: '2026-04-28' },
  { id: 'pr5', code: 'SP-C001', name: 'Đồng phục công sở nữ', status: 'Active', operations: 11, lastUpdated: '2026-05-05' },
  { id: 'pr6', code: 'SP-D001', name: 'Áo khoác mùa đông', status: 'Inactive', operations: 12, lastUpdated: '2025-12-20' },
]

export const OPERATIONS: Operation[] = [
  { id: 'o1', code: 'OP-01', name: 'Cắt vải', unit: 'sản phẩm', category: 'Cắt may' },
  { id: 'o2', code: 'OP-02', name: 'May thân trước', unit: 'sản phẩm', category: 'Cắt may' },
  { id: 'o3', code: 'OP-03', name: 'May thân sau', unit: 'sản phẩm', category: 'Cắt may' },
  { id: 'o4', code: 'OP-04', name: 'May tay áo', unit: 'sản phẩm', category: 'Cắt may' },
  { id: 'o5', code: 'OP-05', name: 'Vắt sổ', unit: 'sản phẩm', category: 'Hoàn thiện' },
  { id: 'o6', code: 'OP-06', name: 'Đính cúc', unit: 'sản phẩm', category: 'Hoàn thiện' },
  { id: 'o7', code: 'OP-07', name: 'Là (ủi)', unit: 'sản phẩm', category: 'Hoàn thiện' },
  { id: 'o8', code: 'OP-08', name: 'Đóng gói', unit: 'sản phẩm', category: 'Hoàn thiện' },
  { id: 'o9', code: 'OP-09', name: 'Kiểm phẩm', unit: 'sản phẩm', category: 'QA' },
]

export const PROD_OP_RATES: ProductOperationRate[] = [
  { id: 'por1', product: 'SP-A001', operation: 'OP-01', rate: 1800, effectiveFrom: '2026-01-01' },
  { id: 'por2', product: 'SP-A001', operation: 'OP-02', rate: 3500, effectiveFrom: '2026-01-01' },
  { id: 'por3', product: 'SP-A001', operation: 'OP-03', rate: 3500, effectiveFrom: '2026-01-01' },
  { id: 'por4', product: 'SP-A001', operation: 'OP-04', rate: 2200, effectiveFrom: '2026-01-01' },
  { id: 'por5', product: 'SP-A001', operation: 'OP-05', rate: 1500, effectiveFrom: '2026-01-01' },
  { id: 'por6', product: 'SP-A001', operation: 'OP-06', rate: 1200, effectiveFrom: '2026-01-01' },
  { id: 'por7', product: 'SP-A001', operation: 'OP-07', rate: 1000, effectiveFrom: '2026-01-01' },
  { id: 'por8', product: 'SP-A001', operation: 'OP-08', rate: 800, effectiveFrom: '2026-01-01' },
  { id: 'por9', product: 'SP-B001', operation: 'OP-01', rate: 2200, effectiveFrom: '2026-01-01' },
  { id: 'por10', product: 'SP-B001', operation: 'OP-02', rate: 4000, effectiveFrom: '2026-01-01' },
]

export const AUDIT_LOGS: AuditLog[] = [
  { id: 'al1', at: '2026-05-22 09:42:14', actor: 'huong.tt', action: 'EMPLOYEE_CREATE', target: 'NV012 Trịnh Thảo Nhi', ip: '10.10.4.22' },
  { id: 'al2', at: '2026-05-22 09:15:02', actor: 'tuan.va', action: 'PAYROLL_LOCK', target: 'PR-2026-04', ip: '10.10.4.18' },
  { id: 'al3', at: '2026-05-22 08:54:21', actor: 'thang.bd', action: 'ATTENDANCE_BULK_IMPORT', target: 'Tổ A - 24 dòng', ip: '10.10.4.51' },
  { id: 'al4', at: '2026-05-21 17:30:08', actor: 'admin', action: 'ROLE_PERMISSION_UPDATE', target: 'supervisor', ip: '10.10.4.2' },
  { id: 'al5', at: '2026-05-21 15:11:55', actor: 'tuan.va', action: 'PAYROLL_GENERATE', target: 'PR-2026-05', ip: '10.10.4.18' },
  { id: 'al6', at: '2026-05-21 11:02:34', actor: 'huong.tt', action: 'EMPLOYEE_UPDATE_SALARY', target: 'NV011 Đặng Quang Huy', ip: '10.10.4.22' },
  { id: 'al7', at: '2026-05-20 16:48:12', actor: 'admin', action: 'ACCOUNT_DISABLE', target: 'mai.lt', ip: '10.10.4.2' },
  { id: 'al8', at: '2026-05-20 09:25:01', actor: 'bao.pq', action: 'LOGIN', target: '—', ip: '10.10.4.71' },
]

export function genAttendance(): AttendanceRow[] {
  const days = 22
  const employees = EMPLOYEES.filter((e) => e.dept === 'PROD').slice(0, 8)
  return employees.map((e) => {
    const cells: AttendanceCell[] = []
    for (let d = 1; d <= days; d++) {
      const r = Math.random()
      let kind: AttendanceKind
      let hours: number | undefined
      if (r < 0.04) {
        kind = 'off'
      } else if (r < 0.08) {
        kind = 'leave'
      } else if (r < 0.18) {
        kind = 'ot'
        hours = 8 + Math.floor(Math.random() * 3)
      } else {
        kind = 'work'
        hours = 8
      }
      cells.push({ d, kind, hours })
    }
    return { employee: e, cells }
  })
}

export function genPayrollRows(periodId: string): PayrollRow[] {
  return EMPLOYEES.map((e) => {
    const base = e.salary
    const workDays = 21 + Math.floor(Math.random() * 4)
    const ot = Math.floor(Math.random() * 8)
    const piecework =
      e.dept === 'PROD' ? Math.floor(800_000 + Math.random() * 1_500_000) : 0
    const allowance = Math.floor(300_000 + Math.random() * 800_000)
    const deductions = Math.floor(200_000 + Math.random() * 600_000)
    const gross =
      Math.round(base * (workDays / 22)) +
      ot * 120_000 +
      piecework +
      allowance
    const net = gross - deductions
    return {
      employee: e,
      workDays,
      ot,
      piecework,
      allowance,
      deductions,
      gross,
      net,
      status: periodId === 'p1' ? 'Draft' : 'Confirmed',
    }
  })
}

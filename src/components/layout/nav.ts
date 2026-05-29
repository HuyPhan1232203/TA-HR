import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  CalendarOff,
  Coins,
  Clock,
  Wallet,
  BarChart3,
  Timer,
  ShieldCheck,
  KeyRound,
  History,
  UserCheck,
  AlarmClockPlus,
} from 'lucide-react'
import type { RouteAccess } from '@/lib/permissions'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  // When set, the item only shows if the user has any of these permissions.
  // Items without `perms` are always visible.
  perms?: string[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [{ to: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard }],
  },
  {
    label: 'Nhân sự',
    items: [
      { to: '/departments', label: 'Phòng ban', icon: Building2 },
      { to: '/employees', label: 'Nhân viên', icon: Users },
      { to: '/salary-rates', label: 'Định mức lương', icon: Coins },
      { to: '/attendances', label: 'Chấm công', icon: CalendarDays },
      { to: '/shift-configs', label: 'Cấu hình ca', icon: Timer },
      { to: '/holidays', label: 'Ngày lễ', icon: CalendarOff },
      {
        to: '/my-attendance',
        label: 'Chấm công của tôi',
        icon: UserCheck,
        perms: [
          'attendance.self.check-in',
          'attendance.self.check-out',
          'attendance.self.request',
          'attendance.self.request.read',
        ],
      },
    ],
  },
  {
    label: 'Tính lương',
    items: [
      { to: '/salary-periods', label: 'Kỳ lương', icon: Clock },
      { to: '/payroll-runs', label: 'Bảng lương', icon: Wallet },
      { to: '/overtime-approvals', label: 'Duyệt tăng ca', icon: AlarmClockPlus },
      { to: '/reports', label: 'Báo cáo', icon: BarChart3 },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/system/accounts', label: 'Tài khoản', icon: ShieldCheck },
      { to: '/system/roles', label: 'Vai trò & quyền', icon: KeyRound },
      { to: '/system/audit-logs', label: 'Nhật ký hoạt động', icon: History },
    ],
  },
]

export const ROUTE_ACCESS: Record<string, RouteAccess> = {
  '/departments': { perms: ['hr.departments.manage', 'hr.departments.read'] },
  '/employees': { perms: ['hr.employees.manage', 'hr.employees.read'] },
  '/salary-rates': { perms: ['hr.employees.manage', 'hr.employees.read'] },
  '/attendances': { perms: ['attendance.read'] },
  '/shift-configs': { perms: ['attendance.read'] },
  '/holidays': { perms: ['attendance.read'] },
  '/my-attendance': {
    perms: [
      'attendance.self.check-in',
      'attendance.self.check-out',
      'attendance.self.request',
      'attendance.self.request.read',
    ],
  },
  '/salary-periods': { perms: ['payroll.periods.read'] },
  '/payroll-runs': { perms: ['payroll.read'] },
  '/overtime-approvals': { perms: ['attendance.read'] },
  '/reports': { perms: ['payroll.reports.read'] },
  '/system/accounts': { perms: ['accounts.manage', 'accounts.read'] },
  '/system/roles': { perms: ['roles.manage', 'roles.read'] },
  '/system/audit-logs': { roles: ['admin'] },
}

export interface ScreenMeta {
  title: string
  subtitle: string
}

export const SCREEN_META: Record<string, ScreenMeta> = {
  '/dashboard': { title: 'Bảng điều khiển', subtitle: 'Tổng quan TA CONSULTANT' },
  '/departments': { title: 'Phòng ban', subtitle: 'Cơ cấu tổ chức' },
  '/employees': { title: 'Nhân viên', subtitle: 'Hồ sơ & tài khoản' },
  '/salary-rates': { title: 'Định mức lương', subtitle: 'Định mức theo nhân viên' },
  '/attendances': { title: 'Chấm công', subtitle: 'Bảng công tháng' },
  '/shift-configs': { title: 'Cấu hình ca', subtitle: 'Ca làm việc & phiên' },
  '/holidays': { title: 'Ngày lễ', subtitle: 'Lịch nghỉ lễ' },
  '/my-attendance': { title: 'Chấm công của tôi', subtitle: 'Check-in & đơn điều chỉnh' },
  '/salary-periods': { title: 'Kỳ lương', subtitle: 'Chu kỳ tính lương' },
  '/payroll-runs': { title: 'Bảng lương', subtitle: 'Generate & xác nhận' },
  '/overtime-approvals': { title: 'Duyệt tăng ca', subtitle: 'Đơn tăng ca & chọn kỳ bù giờ' },
  '/reports': { title: 'Báo cáo', subtitle: 'Thống kê tài chính & nhân sự' },
  '/system/accounts': { title: 'Tài khoản', subtitle: 'Người dùng hệ thống' },
  '/system/roles': { title: 'Vai trò & quyền', subtitle: 'Phân quyền theo module' },
  '/system/audit-logs': { title: 'Nhật ký hoạt động', subtitle: 'Lịch sử thao tác' },
}

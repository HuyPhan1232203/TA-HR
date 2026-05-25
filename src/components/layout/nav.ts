import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Coins,
  Clock,
  Wallet,
  BarChart3,
  ShieldCheck,
  KeyRound,
  History,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
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
    ],
  },
  {
    label: 'Tính lương',
    items: [
      { to: '/salary-periods', label: 'Kỳ lương', icon: Clock },
      { to: '/payroll-runs', label: 'Bảng lương', icon: Wallet },
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

export interface ScreenMeta {
  title: string
  subtitle: string
}

export const SCREEN_META: Record<string, ScreenMeta> = {
  '/dashboard': { title: 'Bảng điều khiển', subtitle: 'Tổng quan TA-HR' },
  '/departments': { title: 'Phòng ban', subtitle: 'Cơ cấu tổ chức' },
  '/employees': { title: 'Nhân viên', subtitle: 'Hồ sơ & tài khoản' },
  '/salary-rates': { title: 'Định mức lương', subtitle: 'Định mức theo nhân viên' },
  '/attendances': { title: 'Chấm công', subtitle: 'Bảng công tháng' },
  '/salary-periods': { title: 'Kỳ lương', subtitle: 'Chu kỳ tính lương' },
  '/payroll-runs': { title: 'Bảng lương', subtitle: 'Generate & xác nhận' },
  '/reports': { title: 'Báo cáo', subtitle: 'Thống kê tài chính & nhân sự' },
  '/system/accounts': { title: 'Tài khoản', subtitle: 'Người dùng hệ thống' },
  '/system/roles': { title: 'Vai trò & quyền', subtitle: 'Phân quyền theo module' },
  '/system/audit-logs': { title: 'Nhật ký hoạt động', subtitle: 'Lịch sử thao tác' },
}

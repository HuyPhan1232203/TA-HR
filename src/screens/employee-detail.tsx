import { useMemo, useState } from 'react'
import type * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Coins,
  Edit,
  ExternalLink,
  KeyRound,
  Plus,
  Unlink,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Avatar } from '../components/ui/avatar'
import { Empty } from '../components/ui/empty'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@/components/ui/table'
import { useEmployees, useCreateEmployeeAccount } from '@/hooks/useEmployees'
import { useAccounts, useUpdateAccount } from '@/hooks/useAccounts'
import { useRoles } from '@/hooks/useRoles'
import { useAuth } from '@/components/auth-context'
import { hasAnyPermission } from '@/lib/permissions'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployeeSalaryRates } from '@/hooks/useEmployeeSalaryRates'
import { useAttendances } from '@/hooks/useAttendances'
import { usePayrollPeriods } from '@/hooks/usePayroll'
import {
  useAssignShift,
  useEmployeeShiftAssignments,
  useShiftConfigs,
} from '@/hooks/useShifts'
import type { SalaryCalculationType, EmployeeStatus } from '@/types/EmployeeType'
import type { AccountStatus } from '@/types/AccountType'
import { fmtDate, fmtVND } from '../lib/format'
import { cn } from '../lib/utils'

const SALARY_LABELS: Record<SalaryCalculationType, string> = {
  FixedMonthly: 'Lương tháng cố định',
  DailyWage: 'Lương theo công',
  HourlyWage: 'Lương theo giờ',
  ProductBased: 'Lương sản phẩm',
  Mixed: 'Lương hỗn hợp',
}

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  Active: 'Đang làm việc',
  Inactive: 'Ngừng',
  Resigned: 'Đã nghỉ việc',
}

type Tab = 'overview' | 'rates' | 'attendance' | 'shifts' | 'payroll'

export function EmployeeDetailScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')

  const { session } = useAuth()
  const canManageAccounts = hasAnyPermission(session, [
    'accounts.manage',
    'accounts.create',
  ])

  const { data: shiftConfigs = [] } = useShiftConfigs()
  const { data: assignments = [] } = useEmployeeShiftAssignments(id || undefined)
  const assignMut = useAssignShift()
  const [assignConfigId, setAssignConfigId] = useState('')
  const [assignFrom, setAssignFrom] = useState('')
  const [assignTo, setAssignTo] = useState('')

  const { data: accounts = [] } = useAccounts()
  const { data: roles = [] } = useRoles()
  const linkedAccount = accounts.find((a) => a.employeeId === id)
  const createAccountMut = useCreateEmployeeAccount()
  const [accountOpen, setAccountOpen] = useState(false)
  const [acctUsername, setAcctUsername] = useState('')
  const [acctPassword, setAcctPassword] = useState('')
  const [acctRoleIds, setAcctRoleIds] = useState<string[]>([])

  const createAccount = async () => {
    if (!acctUsername.trim()) {
      toast.error('Nhập tên đăng nhập')
      return
    }
    try {
      await createAccountMut.mutateAsync({
        employeeId: id,
        data: {
          username: acctUsername.trim(),
          password: acctPassword || null,
          roleIds: acctRoleIds,
        },
      })
      toast.success('Đã tạo tài khoản cho nhân viên')
      setAccountOpen(false)
      setAcctUsername('')
      setAcctPassword('')
      setAcctRoleIds([])
    } catch (e) {
      toast.error('Không thể tạo tài khoản', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const updateAccountMut = useUpdateAccount()
  const [editAcctOpen, setEditAcctOpen] = useState(false)
  const [editAcctRoleIds, setEditAcctRoleIds] = useState<string[]>([])
  const [editAcctPassword, setEditAcctPassword] = useState('')
  const [editAcctStatus, setEditAcctStatus] = useState<AccountStatus>('Active')
  const [unlinkOpen, setUnlinkOpen] = useState(false)

  const openEditAccount = () => {
    if (!linkedAccount) return
    setEditAcctRoleIds(
      linkedAccount.roles
        .map((code) => roles.find((r) => r.code === code)?.id)
        .filter((rid): rid is string => Boolean(rid)),
    )
    setEditAcctPassword('')
    setEditAcctStatus(linkedAccount.status)
    setEditAcctOpen(true)
  }

  const saveEditAccount = async () => {
    if (!linkedAccount) return
    try {
      await updateAccountMut.mutateAsync({
        id: linkedAccount.id,
        data: {
          // Backend PUT requires FullName + RoleIds; keep employeeId so the
          // edit doesn't accidentally unlink.
          fullName: linkedAccount.fullName,
          employeeId: linkedAccount.employeeId,
          roleIds: editAcctRoleIds,
          status: editAcctStatus,
          ...(editAcctPassword ? { newPassword: editAcctPassword } : {}),
        },
      })
      toast.success('Đã cập nhật tài khoản')
      setEditAcctOpen(false)
    } catch (e) {
      toast.error('Không thể cập nhật tài khoản', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const unlinkAccount = async () => {
    if (!linkedAccount) return
    try {
      await updateAccountMut.mutateAsync({
        id: linkedAccount.id,
        data: {
          // Backend PUT requires FullName + RoleIds even when only detaching.
          fullName: linkedAccount.fullName,
          roleIds: linkedAccount.roles
            .map((code) => roles.find((r) => r.code === code)?.id)
            .filter((rid): rid is string => Boolean(rid)),
          status: linkedAccount.status,
          employeeId: null,
        },
      })
      toast.success('Đã gỡ liên kết tài khoản')
    } catch (e) {
      toast.error('Không thể gỡ liên kết', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const assignShift = async () => {
    if (!assignConfigId || !assignFrom) {
      toast.error('Chọn ca và ngày áp dụng')
      return
    }
    try {
      await assignMut.mutateAsync({
        employeeId: id,
        data: {
          attendanceShiftConfigId: assignConfigId,
          effectiveFrom: assignFrom,
          effectiveTo: assignTo || null,
        },
      })
      toast.success('Đã gắn ca cho nhân viên')
      setAssignConfigId('')
      setAssignFrom('')
      setAssignTo('')
    } catch (e) {
      toast.error('Không thể gắn ca', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const { data: employees = [], isLoading } = useEmployees()
  const { data: departments = [] } = useDepartments()
  const employee = employees.find((e) => e.id === id)

  const { data: rates = [] } = useEmployeeSalaryRates(id || undefined)
  const { data: attendance = [] } = useAttendances({ employeeId: id })
  const { data: periods = [] } = usePayrollPeriods()

  const deptName = useMemo(() => {
    const m = new Map(departments.map((d) => [d.id, d.name]))
    return (deptId: string) => m.get(deptId) ?? '—'
  }, [departments])

  const recentAttendance = useMemo(
    () =>
      [...attendance]
        .sort((a, b) => b.workDate.localeCompare(a.workDate))
        .slice(0, 8),
    [attendance],
  )
  const activeRate = rates.find((r) => r.isActive) ?? rates[0]

  if (!employee) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
          <ArrowLeft className="size-4" /> Nhân viên
        </Button>
        <Empty
          title={isLoading ? 'Đang tải…' : 'Không tìm thấy nhân viên'}
          desc={isLoading ? undefined : 'Nhân viên không tồn tại hoặc đã bị xóa.'}
        />
      </div>
    )
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3"
        onClick={() => navigate('/employees')}
      >
        <ArrowLeft className="size-4" /> Nhân viên
      </Button>

      {/* Profile header */}
      <Card className="mb-4">
        <CardBody className="flex items-center gap-4">
          <Avatar name={employee.fullName} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {employee.fullName}
              </h2>
              <Badge variant={employee.status === 'Active' ? 'success' : 'muted'}>
                {STATUS_LABELS[employee.status]}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              <code className="font-mono">{employee.code}</code> ·{' '}
              {employee.positionName || '—'} ·{' '}
              <Link
                to={`/employees?departmentId=${employee.departmentId}`}
                className="hover:text-primary hover:underline"
              >
                {deptName(employee.departmentId)}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/salary-rates?employeeId=${employee.id}`}>
                <Coins className="size-4" /> Định mức
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/attendances?employeeId=${employee.id}`}>
                <CalendarDays className="size-4" /> Chấm công
              </Link>
            </Button>
          </div>
        </CardBody>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="rates">Định mức lương</TabsTrigger>
          <TabsTrigger value="attendance">Chấm công</TabsTrigger>
          <TabsTrigger value="shifts">Ca làm việc</TabsTrigger>
          <TabsTrigger value="payroll">Bảng lương</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin</CardTitle>
                </CardHeader>
                <CardBody className="text-sm divide-y">
                  <Row label="Mã nhân viên" value={employee.code} />
                  <Row
                    label="Phòng ban"
                    value={
                      <Link
                        to={`/employees?departmentId=${employee.departmentId}`}
                        className="hover:text-primary hover:underline"
                      >
                        {deptName(employee.departmentId)}
                      </Link>
                    }
                  />
                  <Row label="Chức danh" value={employee.positionName || '—'} />
                  <Row
                    label="Hình thức lương"
                    value={SALARY_LABELS[employee.salaryCalculationType]}
                  />
                  <Row label="Trạng thái" value={STATUS_LABELS[employee.status]} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Định mức đang áp dụng</CardTitle>
                </CardHeader>
                <CardBody className="text-sm">
                  {activeRate ? (
                    <div className="divide-y">
                      <Row
                        label="Hình thức"
                        value={SALARY_LABELS[activeRate.calculationType]}
                      />
                      <Row label="Lương tháng" value={fmtVND(activeRate.monthlySalary)} />
                      <Row label="Đơn giá ngày" value={fmtVND(activeRate.dailyRate)} />
                      <Row label="Đơn giá giờ" value={fmtVND(activeRate.hourlyRate)} />
                      <Row
                        label="Hiệu lực từ"
                        value={fmtDate(activeRate.effectiveFrom)}
                      />
                    </div>
                  ) : (
                    <div className="text-muted-foreground py-4">
                      Chưa có định mức lương.
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Tài khoản</CardTitle>
                {linkedAccount && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to={`/system/accounts?q=${encodeURIComponent(linkedAccount.username)}`}
                    >
                      Accounts <ExternalLink className="size-3.5" />
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardBody>
                {linkedAccount ? (
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          @{linkedAccount.username}
                        </span>
                        <Badge
                          variant={
                            linkedAccount.status === 'Active'
                              ? 'success'
                              : 'destructive'
                          }
                        >
                          {linkedAccount.status === 'Active'
                            ? 'Hoạt động'
                            : 'Đã khóa'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {linkedAccount.roles.map((rc) => {
                          const r = roles.find((x) => x.code === rc)
                          return (
                            <Badge key={rc} variant="outline">
                              {r?.name ?? rc}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                    {canManageAccounts && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openEditAccount}
                        >
                          <Edit className="size-4" /> Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUnlinkOpen(true)}
                        >
                          <Unlink className="size-4" /> Gỡ liên kết
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Chưa có tài khoản đăng nhập.
                    </span>
                    {canManageAccounts && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAccountOpen(true)}
                      >
                        <KeyRound className="size-4" /> Tạo tài khoản
                      </Button>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'rates' && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Lịch sử định mức lương</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/salary-rates?employeeId=${employee.id}`}>
                  Quản lý <ExternalLink className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hình thức</TableHead>
                  <TableHead className="text-right">Tháng</TableHead>
                  <TableHead className="text-right">Ngày</TableHead>
                  <TableHead className="text-right">Giờ</TableHead>
                  <TableHead>Hiệu lực từ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{SALARY_LABELS[r.calculationType]}</TableCell>
                    <TableCell className="text-right num">{fmtVND(r.monthlySalary)}</TableCell>
                    <TableCell className="text-right num">{fmtVND(r.dailyRate)}</TableCell>
                    <TableCell className="text-right num">{fmtVND(r.hourlyRate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(r.effectiveFrom)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isActive ? 'success' : 'muted'}>
                        {r.isActive ? 'Đang áp dụng' : 'Hết hiệu lực'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {rates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                      Chưa có định mức lương.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {tab === 'attendance' && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Chấm công gần đây</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/attendances?employeeId=${employee.id}`}>
                  Xem lịch <ExternalLink className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Ca</TableHead>
                  <TableHead className="text-right">Giờ công</TableHead>
                  <TableHead className="text-right">OT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAttendance.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{fmtDate(a.workDate)}</TableCell>
                    <TableCell className="text-sm">{a.shiftCode || '—'}</TableCell>
                    <TableCell className="text-right num">{a.workingHours}</TableCell>
                    <TableCell className="text-right num">{a.overtimeHours}</TableCell>
                  </TableRow>
                ))}
                {recentAttendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                      Chưa có chấm công.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {tab === 'shifts' && (
          <Card>
            <CardHeader>
              <CardTitle>Gắn ca theo thời gian</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-4 gap-3 items-end">
                <div className="col-span-2 space-y-1.5">
                  <Label>Ca làm việc</Label>
                  <Select value={assignConfigId} onValueChange={setAssignConfigId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— Chọn ca —" />
                    </SelectTrigger>
                    <SelectContent>
                      {shiftConfigs.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.shiftCode} — {c.name} ({c.totalHours}h)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Áp dụng từ</Label>
                  <DatePicker value={assignFrom} onChange={setAssignFrom} />
                </div>
                <div className="space-y-1.5">
                  <Label>Đến (tùy chọn)</Label>
                  <DatePicker value={assignTo} onChange={setAssignTo} />
                </div>
              </div>
              <Button onClick={assignShift} disabled={assignMut.isPending}>
                <Plus className="size-4" /> Gắn ca
              </Button>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ca</TableHead>
                    <TableHead>Phiên</TableHead>
                    <TableHead className="text-right">Tổng giờ</TableHead>
                    <TableHead>Hiệu lực</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.shiftCode} — {a.shiftName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {a.sessions.map((s) => (
                            <Badge key={s.sessionOrder} variant="secondary">
                              {s.checkIn}–{s.checkOut}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right num">{a.totalHours}h</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(a.effectiveFrom)} → {fmtDate(a.effectiveTo)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {assignments.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-muted-foreground py-6"
                      >
                        Chưa gắn ca nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        )}

        {tab === 'payroll' && (
          <Card>
            <CardHeader>
              <CardTitle>Bảng lương theo kỳ</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kỳ lương</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(p.fromDate)} → {fmtDate(p.toDate)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/payroll-runs?periodId=${p.id}`}>
                          <Wallet className="size-4" /> Xem
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {periods.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                      Chưa có kỳ lương.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo tài khoản cho nhân viên</DialogTitle>
            <DialogDescription>
              {employee.fullName} ({employee.code}). Để trống mật khẩu để hệ
              thống tự sinh <code>{'<username>@123'}</code>; bỏ trống vai trò để
              gán mặc định <code>employee</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tên đăng nhập *</Label>
                <Input
                  value={acctUsername}
                  onChange={(e) => setAcctUsername(e.target.value)}
                  placeholder="nv001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mật khẩu</Label>
                <Input
                  type="password"
                  value={acctPassword}
                  onChange={(e) => setAcctPassword(e.target.value)}
                  placeholder="Tự sinh nếu để trống"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vai trò</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-none">
                {roles.map((r) => {
                  const checked = acctRoleIds.includes(r.id)
                  return (
                    <label
                      key={r.id}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1 rounded-none border cursor-pointer text-sm',
                        checked
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'hover:bg-muted',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setAcctRoleIds(
                            e.target.checked
                              ? [...acctRoleIds, r.id]
                              : acctRoleIds.filter((x) => x !== r.id),
                          )
                        }
                        className="rounded"
                      />
                      {r.name}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountOpen(false)}>
              Hủy
            </Button>
            <Button onClick={createAccount} disabled={createAccountMut.isPending}>
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editAcctOpen} onOpenChange={setEditAcctOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa tài khoản</DialogTitle>
            <DialogDescription>
              {linkedAccount ? `@${linkedAccount.username}` : ''} — đổi vai trò,
              đặt lại mật khẩu hoặc khóa tài khoản.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Vai trò</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-none">
                {roles.map((r) => {
                  const checked = editAcctRoleIds.includes(r.id)
                  return (
                    <label
                      key={r.id}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1 rounded-none border cursor-pointer text-sm',
                        checked
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'hover:bg-muted',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setEditAcctRoleIds(
                            e.target.checked
                              ? [...editAcctRoleIds, r.id]
                              : editAcctRoleIds.filter((x) => x !== r.id),
                          )
                        }
                        className="rounded"
                      />
                      {r.name}
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Đặt lại mật khẩu</Label>
                <Input
                  type="password"
                  value={editAcctPassword}
                  onChange={(e) => setEditAcctPassword(e.target.value)}
                  placeholder="Để trống nếu không đổi"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select
                  value={editAcctStatus}
                  onValueChange={(v) => setEditAcctStatus(v as AccountStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Đang hoạt động</SelectItem>
                    <SelectItem value="Locked">Đã khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAcctOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={saveEditAccount}
              disabled={updateAccountMut.isPending}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={unlinkOpen}
        onOpenChange={setUnlinkOpen}
        title="Gỡ liên kết tài khoản?"
        description={`Tài khoản @${linkedAccount?.username ?? ''} sẽ tách khỏi nhân viên này. Tài khoản không bị xóa.`}
        danger
        confirmText="Gỡ liên kết"
        onConfirm={unlinkAccount}
      />
    </div>
  )
}

function Row({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

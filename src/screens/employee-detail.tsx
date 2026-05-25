import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Coins,
  ExternalLink,
  Plus,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Avatar } from '../components/ui/avatar'
import { Empty } from '../components/ui/empty'
import { Label } from '../components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@/components/ui/table'
import { useEmployees } from '@/hooks/useEmployees'
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
import { fmtDate, fmtVND } from '../lib/format'

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

  const { data: shiftConfigs = [] } = useShiftConfigs()
  const { data: assignments = [] } = useEmployeeShiftAssignments(id || undefined)
  const assignMut = useAssignShift()
  const [assignConfigId, setAssignConfigId] = useState('')
  const [assignFrom, setAssignFrom] = useState('')
  const [assignTo, setAssignTo] = useState('')

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
              {employee.positionName || '—'} · {deptName(employee.departmentId)}
            </div>
          </div>
          <div className="flex gap-2">
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
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin</CardTitle>
              </CardHeader>
              <CardBody className="text-sm divide-y">
                <Row label="Mã nhân viên" value={employee.code} />
                <Row label="Phòng ban" value={deptName(employee.departmentId)} />
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
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

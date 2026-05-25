import { useMemo, useState } from 'react'
import { Plus, Upload } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { QueryState } from '../components/ui/query-state'
import { PageHeader } from '../components/layout/page-header'
import { toast } from 'sonner'
import { useAttendances, useCreateAttendance } from '@/hooks/useAttendances'
import { useEmployees } from '@/hooks/useEmployees'
import type { IAttendanceFilter, ICreateAttendance } from '@/types/AttendanceType'
import { fmtNum, fmtDate } from '../lib/format'

function fmtTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleTimeString('vi-VN')
}

export function AttendancesScreen() {
  const [employeeId, setEmployeeId] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [open, setOpen] = useState(false)

  const filter = useMemo<IAttendanceFilter>(() => {
    const f: IAttendanceFilter = {}
    if (employeeId !== 'all') f.employeeId = employeeId
    if (fromDate) f.fromDate = fromDate
    if (toDate) f.toDate = toDate
    return f
  }, [employeeId, fromDate, toDate])

  const { data: rows = [], isLoading, error } = useAttendances(filter)
  const { data: employees = [] } = useEmployees()
  const createAttendance = useCreateAttendance()

  const employeeById = useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees],
  )

  // Modal form state
  const [formEmployeeId, setFormEmployeeId] = useState('')
  const [formWorkDate, setFormWorkDate] = useState('')
  const [formShiftCode, setFormShiftCode] = useState('')
  const [formCheckIn, setFormCheckIn] = useState('08:00')
  const [formCheckOut, setFormCheckOut] = useState('17:00')
  const [formWorkingHours, setFormWorkingHours] = useState('8')
  const [formWorkingDayValue, setFormWorkingDayValue] = useState('1')
  const [formOvertimeHours, setFormOvertimeHours] = useState('0')

  const handleSave = async () => {
    const data: ICreateAttendance = {
      employeeId: formEmployeeId || employees[0]?.id || '',
      workDate: formWorkDate,
      ...(formShiftCode ? { shiftCode: formShiftCode } : {}),
      // Backend expects plain "HH:mm" time strings, e.g. "10:00"
      checkIn: formCheckIn,
      checkOut: formCheckOut,
      workingHours: Number(formWorkingHours) || 0,
      workingDayValue: Number(formWorkingDayValue) || 0,
      overtimeHours: Number(formOvertimeHours) || 0,
    }
    try {
      await createAttendance.mutateAsync(data)
      toast.success('Đã lưu chấm công')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu chấm công thất bại')
    }
  }

  return (
    <div>
      <PageHeader
        title="Chấm công"
        description="Nhập, theo dõi giờ công và OT theo ngày."
        actions={
          <>
            <Button variant="outline">
              <Upload className="size-4" /> Import từ máy chấm công
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Nhập công
            </Button>
          </>
        }
      />

      <Card>
        <div className="p-4 border-b flex items-center gap-3 flex-wrap">
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Tất cả nhân viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhân viên</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.code} — {e.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Từ ngày</Label>
            <DatePicker
              value={fromDate}
              onChange={setFromDate}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Đến ngày</Label>
            <DatePicker
              value={toDate}
              onChange={setToDate}
              className="w-[160px]"
            />
          </div>
        </div>

        <QueryState isLoading={isLoading} error={error}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Giờ vào</TableHead>
                <TableHead>Giờ ra</TableHead>
                <TableHead className="text-right">Giờ công</TableHead>
                <TableHead className="text-right">Ngày công</TableHead>
                <TableHead className="text-right">OT</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => {
                const emp = employeeById.get(a.employeeId)
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      {emp ? (
                        <div>
                          <div className="font-medium text-[13px]">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {emp.code}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {a.employeeId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{fmtDate(a.workDate)}</TableCell>
                    <TableCell>{fmtTime(a.checkIn)}</TableCell>
                    <TableCell>{fmtTime(a.checkOut)}</TableCell>
                    <TableCell className="text-right num">
                      {fmtNum(a.workingHours)}
                    </TableCell>
                    <TableCell className="text-right num">
                      {fmtNum(a.workingDayValue)}
                    </TableCell>
                    <TableCell className="text-right num">
                      {fmtNum(a.overtimeHours)}
                    </TableCell>
                    <TableCell>
                      {a.status === 'Confirmed' ? (
                        <Badge variant="success">Đã duyệt</Badge>
                      ) : (
                        <Badge variant="secondary">Nháp</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </QueryState>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nhập chấm công</DialogTitle>
            <DialogDescription>
              Ghi nhận giờ vào / giờ ra cho 1 ngày làm việc
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nhân viên *</Label>
              <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— Chọn nhân viên —" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.code} — {e.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ngày *</Label>
                <DatePicker value={formWorkDate} onChange={setFormWorkDate} />
              </div>
              <div className="space-y-1.5">
                <Label>Ca làm việc</Label>
                <Input
                  value={formShiftCode}
                  onChange={(e) => setFormShiftCode(e.target.value)}
                  placeholder="VD: CA1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Giờ vào</Label>
                <Input
                  type="time"
                  value={formCheckIn}
                  onChange={(e) => setFormCheckIn(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ ra</Label>
                <Input
                  type="time"
                  value={formCheckOut}
                  onChange={(e) => setFormCheckOut(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Giờ công</Label>
                <Input
                  type="number"
                  value={formWorkingHours}
                  onChange={(e) => setFormWorkingHours(e.target.value)}
                  className="num"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày công</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formWorkingDayValue}
                  onChange={(e) => setFormWorkingDayValue(e.target.value)}
                  className="num"
                />
              </div>
              <div className="space-y-1.5">
                <Label>OT (giờ)</Label>
                <Input
                  type="number"
                  value={formOvertimeHours}
                  onChange={(e) => setFormOvertimeHours(e.target.value)}
                  className="num"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={createAttendance.isPending}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

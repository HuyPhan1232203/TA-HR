import { useMemo, useState } from 'react'
import { Plus, Upload } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Modal } from '../components/ui/modal'
import { Table, THead, TH, TR, TD } from '../components/ui/table'
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
  const [formCheckIn, setFormCheckIn] = useState('08:00')
  const [formCheckOut, setFormCheckOut] = useState('17:00')
  const [formWorkingHours, setFormWorkingHours] = useState('8')
  const [formOvertimeHours, setFormOvertimeHours] = useState('0')

  const handleSave = async () => {
    const data: ICreateAttendance = {
      employeeId: formEmployeeId || employees[0]?.id || '',
      workDate: formWorkDate,
      checkIn: formCheckIn,
      checkOut: formCheckOut,
      workingHours: Number(formWorkingHours) || 0,
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
        description="Nhập, theo dõi giờ công và OT theo ngày. /api/attendances"
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
          <Select
            className="w-[260px]"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="all">Tất cả nhân viên</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.code} — {e.fullName}
              </option>
            ))}
          </Select>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Từ ngày</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Đến ngày</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-[160px]"
            />
          </div>
        </div>

        <QueryState isLoading={isLoading} error={error}>
          <Table>
            <THead>
              <TR>
                <TH>Nhân viên</TH>
                <TH>Ngày</TH>
                <TH>Giờ vào</TH>
                <TH>Giờ ra</TH>
                <TH className="text-right">Giờ công</TH>
                <TH className="text-right">Ngày công</TH>
                <TH className="text-right">OT</TH>
                <TH>Trạng thái</TH>
              </TR>
            </THead>
            <tbody>
              {rows.map((a) => {
                const emp = employeeById.get(a.employeeId)
                return (
                  <TR key={a.id}>
                    <TD>
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
                    </TD>
                    <TD>{fmtDate(a.workDate)}</TD>
                    <TD>{fmtTime(a.checkIn)}</TD>
                    <TD>{fmtTime(a.checkOut)}</TD>
                    <TD className="text-right num">{fmtNum(a.workingHours)}</TD>
                    <TD className="text-right num">
                      {fmtNum(a.workingDayValue)}
                    </TD>
                    <TD className="text-right num">{fmtNum(a.overtimeHours)}</TD>
                    <TD>
                      {a.status === 'Confirmed' ? (
                        <Badge variant="success">Đã duyệt</Badge>
                      ) : (
                        <Badge variant="secondary">Nháp</Badge>
                      )}
                    </TD>
                  </TR>
                )
              })}
            </tbody>
          </Table>
        </QueryState>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nhập chấm công"
        description="Ghi nhận giờ vào / giờ ra cho 1 ngày làm việc"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={createAttendance.isPending}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nhân viên *</Label>
            <Select
              value={formEmployeeId}
              onChange={(e) => setFormEmployeeId(e.target.value)}
            >
              <option value="">— Chọn nhân viên —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} — {e.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Ngày *</Label>
              <Input
                type="date"
                value={formWorkDate}
                onChange={(e) => setFormWorkDate(e.target.value)}
              />
            </div>
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
          <div className="grid grid-cols-2 gap-3">
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
      </Modal>
    </div>
  )
}

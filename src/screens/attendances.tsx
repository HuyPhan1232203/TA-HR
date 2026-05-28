import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameMonth,
  isToday,
  startOfMonth,
  subDays,
} from 'date-fns'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog, type ConfirmState } from '@/components/ui/confirm-dialog'
import { Avatar } from '../components/ui/avatar'
import {
  useAttendances,
  useCreateAttendance,
  useDeleteAttendance,
} from '@/hooks/useAttendances'
import { useEmployees } from '@/hooks/useEmployees'
import { useEmployeeShiftAssignments } from '@/hooks/useShifts'
import { usePayrollPeriods } from '@/hooks/usePayroll'
import type { IAttendance, ICreateAttendance } from '@/types/AttendanceType'
import type { IShiftSession } from '@/types/ShiftType'
import { cn } from '../lib/utils'

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Working hours = overlap of [checkIn,checkOut] with the shift sessions
// (breaks excluded, so it's naturally capped at the shift total). OT = time
// worked after the last session's checkOut.
function computeShiftHours(
  checkIn: string,
  checkOut: string,
  sessions: IShiftSession[],
) {
  const inM = toMinutes(checkIn)
  const outM = toMinutes(checkOut)
  if (!sessions.length || outM <= inM)
    return { workingHours: 0, overtimeHours: 0 }
  let work = 0
  let lastOut = 0
  for (const s of sessions) {
    const sI = toMinutes(s.checkIn)
    const sO = toMinutes(s.checkOut)
    work += Math.max(0, Math.min(outM, sO) - Math.max(inM, sI))
    if (sO > lastOut) lastOut = sO
  }
  const ot = Math.max(0, outM - lastOut)
  const round = (min: number) => Math.round((min / 60) * 100) / 100
  return { workingHours: round(work), overtimeHours: round(ot) }
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const MONTHS = Array.from({ length: 12 }, (_, i) => i)
const dayKey = (d: Date) => format(d, 'yyyy-MM-dd')

interface AddForm {
  employeeId: string
  workDate: string
  shiftCode: string
  checkIn: string
  checkOut: string
  workingHours: string
  workingDayValue: string
  overtimeHours: string
}

const blankForm = (workDate: string, employeeId: string): AddForm => ({
  employeeId,
  workDate,
  shiftCode: '',
  checkIn: '08:00',
  checkOut: '17:00',
  workingHours: '8',
  workingDayValue: '1',
  overtimeHours: '0',
})

export function AttendancesScreen() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(startOfMonth(today))
  const [searchParams] = useSearchParams()
  const [employeeId, setEmployeeId] = useState(
    searchParams.get('employeeId') ?? '',
  ) // '' = all
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<AddForm>(blankForm(dayKey(today), ''))
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)

  const filter = useMemo(
    () => ({
      employeeId: employeeId || undefined,
      fromDate: dayKey(monthStart),
      toDate: dayKey(monthEnd),
    }),
    [employeeId, monthStart, monthEnd],
  )

  const { data: rows = [], isFetching, refetch } = useAttendances(filter)
  const { data: employees = [] } = useEmployees()
  const { data: periods = [] } = usePayrollPeriods()

  // Guide §10: no create/delete of attendance inside a Locked/Paid period.
  const lockedPeriodFor = useMemo(() => {
    const locked = periods.filter(
      (p) => p.status === 'Locked' || p.status === 'Paid',
    )
    return (workDate: string) => {
      const d = workDate.slice(0, 10)
      return (
        locked.find(
          (p) => p.fromDate.slice(0, 10) <= d && d <= p.toDate.slice(0, 10),
        ) ?? null
      )
    }
  }, [periods])
  // Shifts assigned to the employee being entered (guide §7)
  const { data: shiftAssignments = [] } = useEmployeeShiftAssignments(
    form.employeeId || undefined,
  )
  const createMut = useCreateAttendance()
  const deleteMut = useDeleteAttendance()

  const empName = useMemo(() => {
    const m = new Map(employees.map((e) => [e.id, e.fullName]))
    return (id: string) => m.get(id) ?? id
  }, [employees])

  // Bucket attendance rows by workDate (yyyy-MM-dd)
  const byDay = useMemo(() => {
    const m = new Map<string, IAttendance[]>()
    for (const r of rows) {
      const k = r.workDate.slice(0, 10)
      const arr = m.get(k)
      if (arr) arr.push(r)
      else m.set(k, [r])
    }
    return m
  }, [rows])

  // 6-week grid, Monday-first, covering the whole visible month
  const cells = useMemo(() => {
    const lead = (getDay(monthStart) + 6) % 7 // Mon=0 … Sun=6
    const gridStart = subDays(monthStart, lead)
    return eachDayOfInterval({ start: gridStart, end: addDays(gridStart, 41) })
  }, [monthStart])

  const goMonth = (delta: number) =>
    setViewDate((d) => startOfMonth(new Date(d.getFullYear(), d.getMonth() + delta, 1)))

  const openAddFor = (date: string) => {
    setForm(blankForm(date, employeeId))
    setAddOpen(true)
  }

  const saveAdd = async () => {
    if (!form.employeeId) {
      toast.error('Chọn nhân viên')
      return
    }
    if (!form.workDate) {
      toast.error('Chọn ngày')
      return
    }
    const lp = lockedPeriodFor(form.workDate)
    if (lp) {
      toast.error('Kỳ lương đã khóa/đã trả', {
        description: `Không thể nhập chấm công trong kỳ "${lp.name}".`,
      })
      return
    }
    const data: ICreateAttendance = {
      employeeId: form.employeeId,
      workDate: form.workDate,
      ...(form.shiftCode ? { shiftCode: form.shiftCode } : {}),
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      workingHours: Number(form.workingHours) || 0,
      workingDayValue: Number(form.workingDayValue) || 0,
      overtimeHours: Number(form.overtimeHours) || 0,
    }
    try {
      await createMut.mutateAsync(data)
      toast.success('Đã lưu chấm công')
      setAddOpen(false)
    } catch (err) {
      toast.error('Lưu chấm công thất bại', {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  const remove = (r: IAttendance) => {
    const lp = lockedPeriodFor(r.workDate)
    if (lp) {
      toast.error('Kỳ lương đã khóa/đã trả', {
        description: `Không thể xóa chấm công trong kỳ "${lp.name}".`,
      })
      return
    }
    setConfirmState({
      title: 'Xóa chấm công?',
      description: `Bản ghi của ${empName(r.employeeId)} ngày ${r.workDate.slice(0, 10)} sẽ bị xóa.`,
      danger: true,
      confirmText: 'Xóa',
      onConfirm: () => {
        void (async () => {
          try {
            await deleteMut.mutateAsync(r.id)
            toast.success('Đã xóa chấm công')
          } catch (e) {
            toast.error('Không thể xóa', {
              description: e instanceof Error ? e.message : undefined,
            })
          }
        })()
      },
    })
  }

  const selectedRecs = selectedDay ? (byDay.get(selectedDay) ?? []) : []
  const selectedDayLock = selectedDay ? lockedPeriodFor(selectedDay) : null
  const formLock = form.workDate ? lockedPeriodFor(form.workDate) : null

  // Assignments effective on the entry's work date
  const activeAssignments = shiftAssignments.filter(
    (a) =>
      !form.workDate ||
      (a.effectiveFrom <= form.workDate &&
        (!a.effectiveTo || a.effectiveTo >= form.workDate)),
  )

  // Update check-in/out and, if a shift is selected, recompute giờ công + OT
  const setTimes = (patch: { checkIn?: string; checkOut?: string }) =>
    setForm((f) => {
      const next = { ...f, ...patch }
      const shift = activeAssignments.find((a) => a.shiftCode === next.shiftCode)
      if (!shift) return next
      const c = computeShiftHours(next.checkIn, next.checkOut, shift.sessions)
      return {
        ...next,
        workingHours: String(c.workingHours),
        overtimeHours: String(c.overtimeHours),
      }
    })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 rounded-none border bg-card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center size-10 rounded-none bg-primary/10 text-primary">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Chấm công theo lịch
            </div>
            <div className="text-xl font-semibold tracking-tight">
              Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}
            </div>
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Nhân viên
            </Label>
            <Select
              value={employeeId || 'all'}
              onValueChange={(v) => setEmployeeId(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue />
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
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => goMonth(-1)} aria-label="Tháng trước">
              <ChevronLeft className="size-4" />
            </Button>
            <Select
              value={String(viewDate.getMonth())}
              onValueChange={(v) =>
                setViewDate(new Date(viewDate.getFullYear(), Number(v), 1))
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    Tháng {m + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(viewDate.getFullYear())}
              onValueChange={(v) =>
                setViewDate(new Date(Number(v), viewDate.getMonth(), 1))
              }
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map(
                  (y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon-sm" onClick={() => goMonth(1)} aria-label="Tháng sau">
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => void refetch()}
              aria-label="Làm mới"
            >
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            </Button>
            <Button
              size="icon-sm"
              onClick={() => openAddFor(selectedDay ?? dayKey(today))}
              aria-label="Thêm chấm công"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-x border-t bg-muted/30">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="px-3 py-2 text-xs font-medium text-muted-foreground text-center"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t">
        {cells.map((d) => {
          const k = dayKey(d)
          const inMonth = isSameMonth(d, viewDate)
          const recs = byDay.get(k) ?? []
          const hours = recs.reduce((s, r) => s + (r.workingHours || 0), 0)
          const ot = recs.reduce((s, r) => s + (r.overtimeHours || 0), 0)
          const names = Array.from(new Set(recs.map((r) => empName(r.employeeId))))
          return (
            <button
              type="button"
              key={k}
              onClick={() => setSelectedDay(k)}
              className={cn(
                'min-h-[96px] border-r border-b p-2 text-left transition-colors',
                inMonth ? 'bg-card hover:bg-muted/40' : 'bg-muted/20 text-muted-foreground/50',
                selectedDay === k && 'ring-2 ring-inset ring-primary',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-sm',
                    isToday(d) &&
                      'grid place-items-center size-6 rounded-full bg-primary text-primary-foreground font-medium',
                  )}
                >
                  {d.getDate()}
                </span>
                {recs.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {recs.length} dòng
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giờ</span>
                  <span className="num font-medium">{hours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OT</span>
                  <span className="num font-medium">{ot}</span>
                </div>
                <div className="truncate text-muted-foreground">
                  {recs.length === 0
                    ? 'Chưa nhập'
                    : names.length === 1
                      ? names[0]
                      : `${names[0]} +${names.length - 1}`}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Day panel */}
      <Sheet
        open={!!selectedDay}
        onOpenChange={(o) => {
          if (!o) setSelectedDay(null)
        }}
      >
        <SheetContent side="right" className="flex flex-col p-0">
          <SheetHeader>
            <SheetTitle>
              {selectedDay ? format(new Date(selectedDay), 'dd/MM/yyyy') : ''}
            </SheetTitle>
            <SheetDescription>
              {selectedRecs.length} bản ghi chấm công
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 space-y-2">
            {selectedRecs.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Chưa có chấm công cho ngày này.
              </div>
            ) : (
              selectedRecs.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-none border p-3"
                >
                  <Avatar name={empName(r.employeeId)} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {empName(r.employeeId)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.shiftCode ? `Ca ${r.shiftCode} · ` : ''}
                      {r.checkIn}–{r.checkOut} · {r.workingHours}h
                      {r.overtimeHours ? ` · OT ${r.overtimeHours}h` : ''}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Xóa"
                    disabled={!!selectedDayLock}
                    onClick={() => remove(r)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
          <SheetFooter className="flex-col gap-2">
            {selectedDayLock && (
              <div className="flex items-center gap-2 w-full text-xs text-muted-foreground">
                <Lock className="size-3.5 shrink-0" />
                Kỳ lương "{selectedDayLock.name}" đã khóa/đã trả — không thể chỉnh.
              </div>
            )}
            <Button
              className="w-full"
              disabled={!!selectedDayLock}
              onClick={() => selectedDay && openAddFor(selectedDay)}
            >
              <Plus className="size-4" /> Thêm chấm công
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nhập chấm công</DialogTitle>
            <DialogDescription>
              Ghi nhận giờ vào / giờ ra cho 1 ngày làm việc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formLock && (
              <div className="flex items-center gap-2 rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <Lock className="size-4 shrink-0" />
                Kỳ lương "{formLock.name}" đã khóa/đã trả — không thể nhập chấm
                công cho ngày này.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nhân viên *</Label>
                <Select
                  value={form.employeeId}
                  onValueChange={(v) => setForm({ ...form, employeeId: v })}
                >
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
              <div className="space-y-1.5">
                <Label>Ngày *</Label>
                <Input
                  type="date"
                  value={form.workDate}
                  onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Ca làm việc</Label>
                {activeAssignments.length > 0 ? (
                  <Select
                    value={form.shiftCode || undefined}
                    onValueChange={(code) => {
                      const a = activeAssignments.find((x) => x.shiftCode === code)
                      if (!a) {
                        setForm({ ...form, shiftCode: code })
                        return
                      }
                      const checkIn = a.sessions[0]?.checkIn ?? form.checkIn
                      const checkOut =
                        a.sessions[a.sessions.length - 1]?.checkOut ??
                        form.checkOut
                      // Default times to the shift, then compute giờ công + OT
                      const c = computeShiftHours(checkIn, checkOut, a.sessions)
                      setForm({
                        ...form,
                        shiftCode: a.shiftCode,
                        checkIn,
                        checkOut,
                        workingHours: String(c.workingHours),
                        overtimeHours: String(c.overtimeHours),
                      })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— Chọn ca —" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAssignments.map((a) => (
                        <SelectItem key={a.id} value={a.shiftCode}>
                          {a.shiftCode} — {a.shiftName} ({a.totalHours}h)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={form.shiftCode}
                    onChange={(e) =>
                      setForm({ ...form, shiftCode: e.target.value })
                    }
                    placeholder={
                      form.employeeId ? 'Chưa gán ca' : 'Chọn nhân viên trước'
                    }
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Giờ vào</Label>
                <Input
                  type="time"
                  value={form.checkIn}
                  onChange={(e) => setTimes({ checkIn: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ ra</Label>
                <Input
                  type="time"
                  value={form.checkOut}
                  onChange={(e) => setTimes({ checkOut: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Giờ công</Label>
                <Input
                  type="number"
                  className="num"
                  value={form.workingHours}
                  onChange={(e) =>
                    setForm({ ...form, workingHours: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày công</Label>
                <Input
                  type="number"
                  step="0.5"
                  className="num"
                  value={form.workingDayValue}
                  onChange={(e) =>
                    setForm({ ...form, workingDayValue: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>OT (giờ)</Label>
                <Input
                  type="number"
                  className="num"
                  value={form.overtimeHours}
                  onChange={(e) =>
                    setForm({ ...form, overtimeHours: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={saveAdd}
              disabled={createMut.isPending || !!formLock}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(o) => {
          if (!o) setConfirmState(null)
        }}
        title={confirmState?.title ?? ''}
        description={confirmState?.description}
        danger={confirmState?.danger}
        confirmText={confirmState?.confirmText}
        onConfirm={() => {
          confirmState?.onConfirm()
          setConfirmState(null)
        }}
      />
    </div>
  )
}

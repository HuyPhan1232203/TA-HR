import { useState } from 'react'
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  getDay,
  isValid,
  isWithinInterval,
  parse,
  startOfMonth,
} from 'date-fns'
import { Check, Clock, Eye, Lock, Plus, Trash2 } from 'lucide-react'
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
import { ConfirmDialog, type ConfirmState } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
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
import {
  usePayrollPeriods,
  useLockPeriod,
  useMarkPaid,
  useCreatePeriod,
} from '@/hooks/usePayroll'
import type { IPayrollPeriod, PeriodStatus } from '../types/PayrollType'
import { fmtDate } from '../lib/format'

function statusVariant(status: PeriodStatus) {
  if (status === 'Open') return 'default' as const
  if (status === 'Locked') return 'warning' as const
  return 'success' as const
}

function statusLabel(status: PeriodStatus) {
  if (status === 'Open') return 'Đang mở'
  if (status === 'Locked') return 'Đã khóa'
  return 'Đã trả'
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function parseDay(s: string): Date | null {
  if (!s) return null
  const d = parse(s, 'yyyy-MM-dd', new Date())
  return isValid(d) ? d : null
}

// Preview of the selected payroll period: real calendar(s) for the range,
// working days = Mon–Sat (T2–T7), rest = Sunday (CN).
function MiniCalendar({
  fromDate,
  toDate,
}: {
  fromDate: string
  toDate: string
}) {
  const from = parseDay(fromDate)
  const to = parseDay(toDate)

  if (!from || !to || from > to) {
    return (
      <div className="border rounded-none p-3 bg-muted/20 text-xs text-muted-foreground">
        Chọn khoảng thời gian hợp lệ để xem trước.
      </div>
    )
  }

  const days = eachDayOfInterval({ start: from, end: to })
  const restDays = days.filter((d) => getDay(d) === 0).length
  const workingDays = days.length - restDays
  const months = eachMonthOfInterval({ start: from, end: to })

  return (
    <div className="space-y-3">
      <div className="space-y-3 max-h-[260px] overflow-y-auto scrollbar-thin pr-1">
        {months.map((m) => {
          const monthStart = startOfMonth(m)
          const lead = getDay(monthStart)
          const cells = eachDayOfInterval({
            start: monthStart,
            end: endOfMonth(m),
          })
          return (
            <div
              key={m.toISOString()}
              className="border rounded-none p-3 bg-muted/20"
            >
              <div className="text-sm font-medium mb-2">
                Tháng {m.getMonth() + 1} / {m.getFullYear()}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground mb-1">
                {WEEKDAY_LABELS.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: lead }, (_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {cells.map((d) => {
                  const inRange = isWithinInterval(d, { start: from, end: to })
                  const isSunday = getDay(d) === 0
                  const cls = !inRange
                    ? 'text-muted-foreground/40'
                    : isSunday
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/15 text-primary font-medium'
                  return (
                    <div
                      key={d.toISOString()}
                      className={`aspect-square grid place-items-center rounded text-xs ${cls}`}
                    >
                      {d.getDate()}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="text-xs text-muted-foreground">
        Bao gồm {workingDays} ngày làm việc (T2–T7), {restDays} ngày nghỉ (CN).{' '}
        <Clock className="inline size-3" />
      </div>
    </div>
  )
}

export function SalaryPeriodsScreen() {
  const { data: list = [], isLoading, error } = usePayrollPeriods()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const lockMut = useLockPeriod()
  const paidMut = useMarkPaid()
  const createMut = useCreatePeriod()

  const lock = (p: IPayrollPeriod) => {
    setConfirmState({
      title: 'Khóa kỳ lương?',
      description: `Khóa "${p.name}" để chuyển sang trạng thái Locked. Sau khi khóa không thể chỉnh sửa bảng lương.`,
      confirmText: 'Khóa kỳ',
      onConfirm: () => {
        void (async () => {
          try {
            await lockMut.mutateAsync(p.id)
            toast.success('Đã khóa kỳ lương', { description: p.name })
          } catch (e) {
            toast.error('Không thể khóa kỳ lương', {
              description: e instanceof Error ? e.message : undefined,
            })
          }
        })()
      },
    })
  }

  const paid = (p: IPayrollPeriod) => {
    setConfirmState({
      title: 'Đánh dấu đã trả?',
      description: `Đánh dấu "${p.name}" đã được trả lương. Hành động này không thể hoàn tác.`,
      confirmText: 'Xác nhận đã trả',
      onConfirm: () => {
        void (async () => {
          try {
            await paidMut.mutateAsync(p.id)
            toast.success('Đã đánh dấu đã trả', { description: p.name })
          } catch (e) {
            toast.error('Không thể cập nhật trạng thái', {
              description: e instanceof Error ? e.message : undefined,
            })
          }
        })()
      },
    })
  }

  const create = async () => {
    if (!name || !fromDate || !toDate) {
      toast.error('Vui lòng nhập đủ tên kỳ và khoảng thời gian')
      return
    }
    try {
      await createMut.mutateAsync({ name, fromDate, toDate })
      toast.success('Đã tạo kỳ lương', { description: name })
      setName('')
      setFromDate('')
      setToDate('')
      setOpen(false)
    } catch (e) {
      toast.error('Không thể tạo kỳ lương', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Kỳ lương"
        description="Quản lý chu kỳ tính lương — mở, khóa, đánh dấu đã trả."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Tạo kỳ mới
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm font-medium">Danh sách kỳ lương</div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mọi trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="open">Đang mở</SelectItem>
              <SelectItem value="locked">Đã khóa</SelectItem>
              <SelectItem value="paid">Đã trả</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <QueryState isLoading={isLoading} error={error}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên kỳ</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[280px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtDate(p.fromDate)} → {fmtDate(p.toDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status)}>
                      {statusLabel(p.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="size-4" /> Xem
                      </Button>
                      {p.status === 'Open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => lock(p)}
                          disabled={lockMut.isPending}
                        >
                          <Lock className="size-4" /> Khóa
                        </Button>
                      )}
                      {p.status === 'Locked' && (
                        <Button
                          size="sm"
                          onClick={() => paid(p)}
                          disabled={paidMut.isPending}
                        >
                          <Check className="size-4" /> Đã trả
                        </Button>
                      )}
                      {p.status !== 'Locked' && p.status !== 'Paid' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Xóa"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueryState>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo kỳ lương mới</DialogTitle>
            <DialogDescription>
              Chọn khoảng thời gian áp dụng cho kỳ lương.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tên kỳ *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kỳ lương tháng 06/2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Bắt đầu</Label>
                  <DatePicker value={fromDate} onChange={setFromDate} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kết thúc</Label>
                  <DatePicker value={toDate} onChange={setToDate} />
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Xem trước</Label>
              <MiniCalendar fromDate={fromDate} toDate={toDate} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void create()} disabled={createMut.isPending}>
              {createMut.isPending ? 'Đang tạo…' : 'Tạo kỳ'}
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

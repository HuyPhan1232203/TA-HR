import { useState } from 'react'
import { Check, Clock, Eye, Lock, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Modal } from '../components/ui/modal'
import { useConfirm } from '../components/ui/confirm'
import { toast } from 'sonner'
import {
  Table,
  THead,
  TH,
  TR,
  TD,
} from '../components/ui/table'
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

function MiniCalendar() {
  return (
    <div className="border rounded-lg p-3 bg-muted/20">
      <div className="text-sm font-medium mb-2">Tháng 6 / 2026</div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground mb-1">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 30 }, (_, i) => {
          const day = i + 1
          const weekday = day % 7
          const isWeekend = weekday === 0 || weekday === 6
          return (
            <div
              key={i}
              className={
                isWeekend
                  ? 'aspect-square grid place-items-center rounded text-xs bg-muted text-muted-foreground'
                  : 'aspect-square grid place-items-center rounded text-xs bg-primary/15 text-primary font-medium'
              }
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SalaryPeriodsScreen() {
  const { confirm, node: confirmNode } = useConfirm()
  const { data: list = [], isLoading, error } = usePayrollPeriods()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const lockMut = useLockPeriod()
  const paidMut = useMarkPaid()
  const createMut = useCreatePeriod()

  const lock = async (p: IPayrollPeriod) => {
    const ok = await confirm({
      title: 'Khóa kỳ lương?',
      body: `Khóa "${p.name}" để chuyển sang trạng thái Locked. Sau khi khóa không thể chỉnh sửa bảng lương.`,
      confirmText: 'Khóa kỳ',
    })
    if (!ok) return
    try {
      await lockMut.mutateAsync(p.id)
      toast.success('Đã khóa kỳ lương', { description: p.name })
    } catch (e) {
      toast.error('Không thể khóa kỳ lương', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const paid = async (p: IPayrollPeriod) => {
    const ok = await confirm({
      title: 'Đánh dấu đã trả?',
      body: `Đánh dấu "${p.name}" đã được trả lương. Hành động này không thể hoàn tác.`,
      confirmText: 'Xác nhận đã trả',
    })
    if (!ok) return
    try {
      await paidMut.mutateAsync(p.id)
      toast.success('Đã đánh dấu đã trả', { description: p.name })
    } catch (e) {
      toast.error('Không thể cập nhật trạng thái', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
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
        description="Quản lý chu kỳ tính lương — mở, khóa, đánh dấu đã trả. /api/payroll-periods"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Tạo kỳ mới
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm font-medium">Danh sách kỳ lương</div>
          <Select defaultValue="all" className="w-[160px]">
            <option value="all">Mọi trạng thái</option>
            <option value="open">Đang mở</option>
            <option value="locked">Đã khóa</option>
            <option value="paid">Đã trả</option>
          </Select>
        </div>
        <QueryState isLoading={isLoading} error={error}>
          <Table>
            <THead>
              <TR>
                <TH>Tên kỳ</TH>
                <TH>Thời gian</TH>
                <TH>Trạng thái</TH>
                <TH className="w-[280px]">Thao tác</TH>
              </TR>
            </THead>
            <tbody>
              {list.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium">{p.name}</TD>
                  <TD className="text-sm text-muted-foreground">
                    {fmtDate(p.fromDate)} → {fmtDate(p.toDate)}
                  </TD>
                  <TD>
                    <Badge variant={statusVariant(p.status)}>
                      {statusLabel(p.status)}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="size-4" /> Xem
                      </Button>
                      {p.status === 'Open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void lock(p)}
                          disabled={lockMut.isPending}
                        >
                          <Lock className="size-4" /> Khóa
                        </Button>
                      )}
                      {p.status === 'Locked' && (
                        <Button
                          size="sm"
                          onClick={() => void paid(p)}
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
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </QueryState>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tạo kỳ lương mới"
        description="Chọn khoảng thời gian áp dụng cho kỳ lương."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void create()} disabled={createMut.isPending}>
              {createMut.isPending ? 'Đang tạo…' : 'Tạo kỳ'}
            </Button>
          </>
        }
      >
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
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kết thúc</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Xem trước</Label>
            <MiniCalendar />
            <div className="text-xs text-muted-foreground mt-2">
              Bao gồm 22 ngày làm việc (T2–T7), 8 ngày nghỉ tuần.{' '}
              <Clock className="inline size-3" />
            </div>
          </div>
        </div>
      </Modal>

      {confirmNode}
    </div>
  )
}

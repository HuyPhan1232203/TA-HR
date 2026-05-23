import { useState } from 'react'
import { Check, Clock, DollarSign, Eye, Lock, Plus, Trash2, Unlock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Modal } from '../components/ui/modal'
import { useConfirm } from '../components/ui/confirm'
import { useToast } from '../components/ui/toast'
import {
  Table,
  THead,
  TH,
  TR,
  TD,
} from '../components/ui/table'
import { QueryState } from '../components/ui/query-state'
import { PageHeader } from '../components/layout/page-header'
import { StatCard } from './dashboard'
import {
  QK,
  periodMutations,
  useApiMutation,
  usePayrollPeriods,
} from '../api/resources'
import type { PayrollPeriod, PeriodStatus } from '../types/domain'
import { fmtDate, fmtVND } from '../lib/format'

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
  const toast = useToast()
  const { confirm, node: confirmNode } = useConfirm()
  const { data: list = [], isLoading, error } = usePayrollPeriods()
  const [open, setOpen] = useState(false)

  const lockMut = useApiMutation((id: string) => periodMutations.lock(id), {
    invalidate: [QK.periods],
  })
  const paidMut = useApiMutation((id: string) => periodMutations.paid(id), {
    invalidate: [QK.periods],
  })

  const lock = async (p: PayrollPeriod) => {
    const ok = await confirm({
      title: 'Khóa kỳ lương?',
      body: `Khóa "${p.name}" để chuyển sang trạng thái Locked. Sau khi khóa không thể chỉnh sửa bảng lương.`,
      confirmText: 'Khóa kỳ',
    })
    if (!ok) return
    await lockMut.mutateAsync(p.id)
    toast({ title: 'Đã khóa kỳ lương', desc: p.name })
  }

  const paid = async (p: PayrollPeriod) => {
    const ok = await confirm({
      title: 'Đánh dấu đã trả?',
      body: `Đánh dấu "${p.name}" đã được trả lương. Hành động này không thể hoàn tác.`,
      confirmText: 'Xác nhận đã trả',
    })
    if (!ok) return
    await paidMut.mutateAsync(p.id)
    toast({ title: 'Đã đánh dấu đã trả', desc: p.name })
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

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Kỳ đang mở" value="1" icon={Unlock} hint="PR-2026-05" />
        <StatCard
          label="Đã khóa chờ trả"
          value="1"
          icon={Lock}
          hint="PR-2026-04"
        />
        <StatCard label="Đã trả lương" value="3" icon={Check} hint="Q1 2026" />
        <StatCard label="Tổng chi 12 tháng" value="32.4 tỷ ₫" icon={DollarSign} />
      </div>

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
                <TH>Mã</TH>
                <TH>Thời gian</TH>
                <TH className="text-right">Nhân viên</TH>
                <TH className="text-right">Tổng chi</TH>
                <TH>Trạng thái</TH>
                <TH className="w-[280px]">Thao tác</TH>
              </TR>
            </THead>
            <tbody>
              {list.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium">{p.name}</TD>
                  <TD>
                    <code className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded">
                      {p.code}
                    </code>
                  </TD>
                  <TD className="text-sm text-muted-foreground">
                    {fmtDate(p.startDate)} → {fmtDate(p.endDate)}
                  </TD>
                  <TD className="text-right num">{p.employees}</TD>
                  <TD className="text-right num font-medium">
                    {fmtVND(p.totalAmount)}
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
                          size="iconsm"
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
            <Button
              onClick={() => {
                toast({ title: 'Đã tạo kỳ lương' })
                setOpen(false)
              }}
            >
              Tạo kỳ
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên kỳ *</Label>
              <Input defaultValue="Kỳ lương tháng 06/2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Mã *</Label>
              <Input defaultValue="PR-2026-06" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bắt đầu</Label>
                <Input type="date" defaultValue="2026-06-01" />
              </div>
              <div className="space-y-1.5">
                <Label>Kết thúc</Label>
                <Input type="date" defaultValue="2026-06-30" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Textarea placeholder="Ghi chú nội bộ về kỳ lương…" />
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

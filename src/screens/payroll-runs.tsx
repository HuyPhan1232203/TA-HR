import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Check,
  DollarSign,
  Download,
  Package,
  Plus,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Avatar } from '../components/ui/avatar'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog, type ConfirmState } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@/components/ui/table'
import { QueryState } from '../components/ui/query-state'
import { StatCard } from './dashboard'
import {
  usePayrollPeriods,
  usePayrollRows,
  useGeneratePayroll,
  useEmployeePayroll,
  useConfirmPayroll,
  useAddPayrollItem,
} from '@/hooks/usePayroll'
import type {
  IPayrollRow,
  PayrollItemType,
  PayrollStatus,
  PeriodStatus,
} from '../types/PayrollType'
import { fmtDate, fmtVND } from '../lib/format'
import { cn } from '../lib/utils'

function statusBadge(status: PeriodStatus) {
  if (status === 'Open') return { variant: 'default' as const, label: 'Đang mở', short: 'Mở' }
  if (status === 'Locked') return { variant: 'warning' as const, label: 'Đã khóa', short: 'Khóa' }
  if (status === 'Paid') return { variant: 'success' as const, label: 'Đã trả', short: 'Trả' }
  return { variant: 'secondary' as const, label: 'Nháp', short: 'Nháp' } // Draft
}

// Backend PayrollStatus → badge label/variant
const PAYROLL_STATUS_BADGE: Record<
  PayrollStatus,
  { variant: 'default' | 'secondary' | 'success' | 'warning' | 'muted'; label: string }
> = {
  Draft: { variant: 'muted', label: 'Nháp' },
  Calculated: { variant: 'secondary', label: 'Đã tính' },
  Confirmed: { variant: 'success', label: 'Đã xác nhận' },
  Locked: { variant: 'warning', label: 'Đã khóa' },
  Paid: { variant: 'success', label: 'Đã trả' },
  Cancelled: { variant: 'muted', label: 'Đã hủy' },
}

const PAYROLL_ITEM_LABELS: Record<PayrollItemType, string> = {
  AttendanceSalary: 'Lương công',
  ProductSalary: 'Lương sản phẩm',
  OvertimeSalary: 'Lương OT',
  Allowance: 'Phụ cấp',
  Bonus: 'Thưởng',
  Deduction: 'Khấu trừ',
  Insurance: 'Bảo hiểm',
  Tax: 'Thuế',
}

// Item types a user may add as a manual adjustment
const ADJUST_TYPES: PayrollItemType[] = [
  'Allowance',
  'Bonus',
  'Deduction',
  'Insurance',
  'Tax',
]

interface PayItemProps {
  label: string
  value: number
  bold?: boolean
  highlight?: boolean
}

function PayItem({ label, value, bold, highlight }: PayItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2.5',
        highlight && 'bg-primary/5',
      )}
    >
      <div className={cn('text-sm', bold ? 'font-medium' : 'text-muted-foreground')}>
        {label}
      </div>
      <div
        className={cn(
          'text-sm num',
          bold && 'font-semibold',
          highlight && 'text-primary',
        )}
      >
        {fmtVND(value)}
      </div>
    </div>
  )
}

type PayrollTab = 'all' | 'draft' | 'confirmed'

export function PayrollRunsScreen() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const { data: periods = [] } = usePayrollPeriods()
  const [searchParams] = useSearchParams()
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(
    searchParams.get('periodId'),
  )
  const periodId = selectedPeriodId ?? periods[0]?.id ?? null
  const period = periods.find((p) => p.id === periodId)
  const { data: rows = [], isLoading, error } = usePayrollRows(periodId)
  const [selected, setSelected] = useState<IPayrollRow | null>(null)
  const [tab, setTab] = useState<PayrollTab>('all')

  const generateMut = useGeneratePayroll()
  const detailQuery = useEmployeePayroll(periodId, selected?.employeeId ?? null)
  const detail = detailQuery.data
  const confirmMut = useConfirmPayroll()
  const addItemMut = useAddPayrollItem()

  const blankAdjust = {
    type: 'Allowance' as PayrollItemType,
    name: '',
    quantity: '1',
    unitPrice: '',
    amount: '',
  }
  const [adjust, setAdjust] = useState(blankAdjust)

  const confirmPayroll = async () => {
    if (!detail) return
    try {
      await confirmMut.mutateAsync(detail.id)
      toast.success('Đã xác nhận bảng lương', {
        description: detail.employeeFullName,
      })
      setSelected(null)
    } catch (e) {
      toast.error('Không thể xác nhận', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const addAdjustment = async () => {
    if (!detail) return
    if (!adjust.name) {
      toast.error('Nhập diễn giải dòng điều chỉnh')
      return
    }
    const quantity = Number(adjust.quantity) || 0
    const unitPrice = Number(adjust.unitPrice) || 0
    const amount =
      adjust.amount.trim() === ''
        ? quantity * unitPrice
        : Number(adjust.amount) || 0
    try {
      await addItemMut.mutateAsync({
        payrollId: detail.id,
        data: { type: adjust.type, name: adjust.name, quantity, unitPrice, amount },
      })
      toast.success('Đã thêm dòng điều chỉnh')
      setAdjust(blankAdjust)
    } catch (e) {
      toast.error('Không thể thêm dòng', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const totals = useMemo(
    () =>
      rows.reduce(
        (s, r) => ({
          gross: s.gross + r.grossSalary,
          product: s.product + r.productSalary,
          net: s.net + r.netSalary,
        }),
        { gross: 0, product: 0, net: 0 },
      ),
    [rows],
  )

  const generate = () => {
    if (!period || !periodId) return
    setConfirmState({
      title: 'Tạo lại bảng lương?',
      description: `Hệ thống sẽ tính lại toàn bộ bảng lương cho ${period.name} từ chấm công, sản lượng và đơn giá. Mất khoảng vài giây.`,
      confirmText: 'Generate',
      onConfirm: () => {
        void (async () => {
          try {
            await generateMut.mutateAsync(periodId)
            toast.success('Đã tạo bảng lương', { description: period.name })
          } catch (e) {
            toast.error('Không thể tạo bảng lương', {
              description: e instanceof Error ? e.message : undefined,
            })
          }
        })()
      },
    })
  }

  if (!period) return null
  const badge = statusBadge(period.status)

  const filteredRows = rows.filter((r) => {
    if (tab === 'all') return true
    if (tab === 'draft') return r.status === 'Calculated'
    return r.status === 'Confirmed'
  })

  return (
    <div className="flex h-full">
      <aside className="w-[280px] shrink-0 border-r bg-muted/20 p-4 overflow-y-auto scrollbar-thin">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Kỳ lương
        </div>
        <div className="space-y-1.5">
          {periods.map((p) => {
            const b = statusBadge(p.status)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPeriodId(p.id)
                  setSelected(null)
                }}
                className={cn(
                  'w-full text-left p-3 rounded-none border transition-colors',
                  periodId === p.id
                    ? 'bg-background border-primary/40 ring-1 ring-primary/30 shadow-sm'
                    : 'bg-background/40 border-transparent hover:bg-background',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{p.name}</div>
                  <Badge variant={b.variant} className="shrink-0">
                    {b.short}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {fmtDate(p.fromDate)} → {fmtDate(p.toDate)}
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="text-xs text-muted-foreground">Bảng lương</div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {period.name}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <span>
                {fmtDate(period.fromDate)} → {fmtDate(period.toDate)}
              </span>
              <span>·</span>
              <span>{rows.length} nhân viên</span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="size-4" /> Xuất Excel
            </Button>
            {(period.status === 'Open' || period.status === 'Draft') && (
              <Button onClick={generate} disabled={generateMut.isPending}>
                {generateMut.isPending ? (
                  <>
                    <Sparkles className="size-4 animate-pulse" /> Đang tạo…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Generate bảng lương
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <StatCard label="Tổng lương gộp" value={fmtVND(totals.gross)} icon={DollarSign} />
          <StatCard label="Tổng lương SP" value={fmtVND(totals.product)} icon={Package} />
          <StatCard label="Thực lĩnh" value={fmtVND(totals.net)} icon={Wallet} />
        </div>

        <Card>
          <div className="p-4 border-b flex items-center justify-between gap-3">
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm nhân viên…"
                className="pl-8 w-[260px]"
              />
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as PayrollTab)}>
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="draft">Đã tính</TabsTrigger>
                <TabsTrigger value="confirmed">Đã xác nhận</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <QueryState isLoading={isLoading} error={error}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead className="text-right">Lương công</TableHead>
                  <TableHead className="text-right">Lương SP</TableHead>
                  <TableHead className="text-right">OT</TableHead>
                  <TableHead className="text-right">Gộp</TableHead>
                  <TableHead className="text-right">Thực lĩnh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => (
                  <TableRow
                    key={r.employeeId}
                    className="cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.employeeName} size={30} />
                        <div>
                          <div className="font-medium text-sm">
                            {r.employeeName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {r.employeeCode}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right num">{fmtVND(r.attendanceSalary)}</TableCell>
                    <TableCell className="text-right num text-muted-foreground">
                      {fmtVND(r.productSalary)}
                    </TableCell>
                    <TableCell className="text-right num text-muted-foreground">
                      {fmtVND(r.overtimeSalary)}
                    </TableCell>
                    <TableCell className="text-right num">{fmtVND(r.grossSalary)}</TableCell>
                    <TableCell className="text-right num font-semibold">
                      {fmtVND(r.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={PAYROLL_STATUS_BADGE[r.status].variant}>
                        {PAYROLL_STATUS_BADGE[r.status].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </QueryState>
        </Card>
      </div>

      <Sheet
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelected(null)
        }}
      >
        <SheetContent
          side="right"
          className="w-[520px] sm:max-w-[520px] flex flex-col p-0"
        >
          <SheetHeader>
            <SheetTitle>{selected?.employeeName}</SheetTitle>
            <SheetDescription>
              {selected ? (
                <Link
                  to={`/employees/${selected.employeeId}`}
                  className="hover:text-primary"
                >
                  {selected.employeeCode} · Xem hồ sơ
                </Link>
              ) : undefined}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4">
            <QueryState isLoading={detailQuery.isLoading} error={detailQuery.error}>
              {detail && (
                <div className="space-y-5">
                  <div className="rounded-none border p-4 bg-muted/30">
                    <div className="text-xs text-muted-foreground">Thực lĩnh</div>
                    <div className="text-3xl font-semibold num tracking-tight mt-1">
                      {fmtVND(detail.netSalary)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {period.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Tổng hợp tiền</div>
                    <div className="rounded-none border divide-y">
                      <PayItem label="Lương công" value={detail.attendanceSalary} />
                      <PayItem label="Lương sản phẩm" value={detail.productSalary} />
                      <PayItem label="Lương OT" value={detail.overtimeSalary} />
                      <PayItem label="Phụ cấp" value={detail.allowanceAmount} />
                      <PayItem label="Thưởng" value={detail.bonusAmount} />
                      <PayItem label="Khấu trừ" value={detail.deductionAmount} />
                      <PayItem label="Tổng gộp" value={detail.grossSalary} bold />
                      <PayItem
                        label="Thực lĩnh"
                        value={detail.netSalary}
                        bold
                        highlight
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">
                      Các dòng lương ({detail.items.length})
                    </div>
                    <div className="rounded-none border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Loại</TableHead>
                            <TableHead>Diễn giải</TableHead>
                            <TableHead className="text-right">SL</TableHead>
                            <TableHead className="text-right">Đơn giá</TableHead>
                            <TableHead className="text-right">Thành tiền</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.items.map((it) => (
                            <TableRow key={it.id}>
                              <TableCell className="text-xs">
                                {PAYROLL_ITEM_LABELS[it.type]}
                              </TableCell>
                              <TableCell className="text-sm">{it.name}</TableCell>
                              <TableCell className="text-right num text-muted-foreground">
                                {it.quantity}
                              </TableCell>
                              <TableCell className="text-right num text-muted-foreground">
                                {fmtVND(it.unitPrice)}
                              </TableCell>
                              <TableCell className="text-right num">
                                {fmtVND(it.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {detail.items.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-sm text-muted-foreground py-6"
                              >
                                Chưa có dòng lương nào
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {detail.status === 'Calculated' && (
                    <div>
                      <div className="text-sm font-medium mb-2">
                        Thêm dòng điều chỉnh
                      </div>
                      <div className="rounded-none border p-3 space-y-3 bg-muted/20">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Loại</Label>
                            <Select
                              value={adjust.type}
                              onValueChange={(v) =>
                                setAdjust({ ...adjust, type: v as PayrollItemType })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ADJUST_TYPES.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {PAYROLL_ITEM_LABELS[t]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Diễn giải</Label>
                            <Input
                              value={adjust.name}
                              onChange={(e) =>
                                setAdjust({ ...adjust, name: e.target.value })
                              }
                              placeholder="VD: Phụ cấp cơm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label>Số lượng</Label>
                            <Input
                              type="number"
                              className="num"
                              value={adjust.quantity}
                              onChange={(e) =>
                                setAdjust({ ...adjust, quantity: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Đơn giá</Label>
                            <Input
                              type="number"
                              className="num"
                              value={adjust.unitPrice}
                              onChange={(e) =>
                                setAdjust({ ...adjust, unitPrice: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Thành tiền</Label>
                            <Input
                              type="number"
                              className="num"
                              value={adjust.amount}
                              onChange={(e) =>
                                setAdjust({ ...adjust, amount: e.target.value })
                              }
                              placeholder="= SL × đơn giá"
                            />
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addAdjustment}
                          disabled={addItemMut.isPending}
                        >
                          <Plus className="size-4" /> Thêm dòng
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </QueryState>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Đóng
            </Button>
            <Button
              onClick={confirmPayroll}
              disabled={
                confirmMut.isPending ||
                !detail ||
                detail.status !== 'Calculated' ||
                period.status !== 'Open'
              }
            >
              <Check className="size-4" /> Xác nhận
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(o) => {
          if (!o) setConfirmState(null)
        }}
        title={confirmState?.title ?? ''}
        description={confirmState?.description}
        confirmText={confirmState?.confirmText}
        onConfirm={() => {
          confirmState?.onConfirm()
          setConfirmState(null)
        }}
      />
    </div>
  )
}

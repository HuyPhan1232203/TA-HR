import { useMemo, useState } from 'react'
import {
  Check,
  DollarSign,
  Download,
  Package,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Avatar } from '../components/ui/avatar'
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
} from '@/hooks/usePayroll'
import type { IPayrollRow, PeriodStatus } from '../types/PayrollType'
import { fmtDate, fmtVND } from '../lib/format'
import { cn } from '../lib/utils'

function statusBadge(status: PeriodStatus) {
  if (status === 'Open') return { variant: 'default' as const, label: 'Đang mở', short: 'Mở' }
  if (status === 'Locked') return { variant: 'warning' as const, label: 'Đã khóa', short: 'Khóa' }
  return { variant: 'success' as const, label: 'Đã trả', short: 'Trả' }
}

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
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const periodId = selectedPeriodId ?? periods[0]?.id ?? null
  const period = periods.find((p) => p.id === periodId)
  const { data: rows = [], isLoading, error } = usePayrollRows(periodId)
  const [selected, setSelected] = useState<IPayrollRow | null>(null)
  const [tab, setTab] = useState<PayrollTab>('all')

  const generateMut = useGeneratePayroll()

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
            {period.status === 'Open' && (
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
                      <Badge
                        variant={r.status === 'Confirmed' ? 'success' : 'secondary'}
                      >
                        {r.status === 'Confirmed' ? 'Đã xác nhận' : 'Đã tính'}
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
              {selected ? selected.employeeCode : undefined}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4">
            {selected && (
              <div className="space-y-5">
            <div className="rounded-none border p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground">Thực lĩnh</div>
              <div className="text-3xl font-semibold num tracking-tight mt-1">
                {fmtVND(selected.netSalary)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {period.name}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Chi tiết</div>
              <div className="rounded-none border divide-y">
                <PayItem label="Lương công" value={selected.attendanceSalary} />
                <PayItem label="Lương sản phẩm" value={selected.productSalary} />
                <PayItem label="OT" value={selected.overtimeSalary} />
                <PayItem label="Tổng gộp" value={selected.grossSalary} bold />
                <PayItem
                  label="Thực lĩnh"
                  value={selected.netSalary}
                  bold
                  highlight
                />
              </div>
            </div>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Đóng
            </Button>
            <Button
              onClick={() => {
                toast.success('Đã xác nhận bảng lương')
                setSelected(null)
              }}
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

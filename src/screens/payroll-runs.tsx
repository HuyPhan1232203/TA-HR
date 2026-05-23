import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Check,
  DollarSign,
  Download,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Avatar } from '../components/ui/avatar'
import { Drawer } from '../components/ui/drawer'
import { Tabs } from '../components/ui/tabs'
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
import { StatCard } from './dashboard'
import {
  usePayrollPeriods,
  usePayrollRows,
  useGeneratePayroll,
} from '@/hooks/usePayroll'
import type { PayrollPeriod, PayrollRow, PeriodStatus } from '../types/domain'
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
  negative?: boolean
  highlight?: boolean
}

function PayItem({ label, value, bold, negative, highlight }: PayItemProps) {
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
          negative && 'text-destructive',
          highlight && 'text-primary',
        )}
      >
        {fmtVND(value)}
      </div>
    </div>
  )
}

export function PayrollRunsScreen() {
  const { confirm, node: confirmNode } = useConfirm()
  const { data: periods = [] } = usePayrollPeriods()
  const [periodId, setPeriodId] = useState<string>('p1')
  const period: PayrollPeriod | undefined = periods.find((p) => p.id === periodId)
  const { data: rows = [], isLoading, error } = usePayrollRows(periodId)
  const [selected, setSelected] = useState<PayrollRow | null>(null)
  const [tab, setTab] = useState<'all' | 'draft' | 'confirmed'>('all')

  const generateMut = useGeneratePayroll()

  const totals = useMemo(
    () =>
      rows.reduce(
        (s, r) => ({
          gross: s.gross + r.gross,
          net: s.net + r.net,
          deductions: s.deductions + r.deductions,
        }),
        { gross: 0, net: 0, deductions: 0 },
      ),
    [rows],
  )

  const generate = async () => {
    if (!period) return
    const ok = await confirm({
      title: 'Tạo lại bảng lương?',
      body: `Hệ thống sẽ tính lại toàn bộ bảng lương cho ${period.name} từ chấm công, sản lượng và đơn giá. Mất khoảng vài giây.`,
      confirmText: 'Generate',
    })
    if (!ok) return
    await generateMut.mutateAsync(periodId)
    toast.success('Đã tạo bảng lương', {
      description: `${rows.length} dòng cho ${period.name}`,
    })
  }

  if (!period) return null
  const badge = statusBadge(period.status)

  const filteredRows = rows.filter((r) => {
    if (tab === 'all') return true
    if (tab === 'draft') return r.status === 'Draft'
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
                  setPeriodId(p.id)
                  setSelected(null)
                }}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
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
                  {fmtDate(p.startDate)} → {fmtDate(p.endDate)}
                </div>
                <div className="text-[11px] num text-muted-foreground mt-0.5">
                  {p.employees} NV · {fmtVND(p.totalAmount)}
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
                {fmtDate(period.startDate)} → {fmtDate(period.endDate)}
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
              <Button onClick={() => void generate()} disabled={generateMut.isPending}>
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
          <StatCard
            label="Tổng khấu trừ"
            value={fmtVND(totals.deductions)}
            icon={AlertTriangle}
          />
          <StatCard label="Thực lĩnh" value={fmtVND(totals.net)} icon={Check} />
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
            <Tabs<typeof tab>
              tabs={[
                { value: 'all', label: 'Tất cả' },
                { value: 'draft', label: 'Bản nháp' },
                { value: 'confirmed', label: 'Đã xác nhận' },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
          <QueryState isLoading={isLoading} error={error}>
            <Table>
              <THead>
                <TR>
                  <TH>Nhân viên</TH>
                  <TH className="text-right">Công</TH>
                  <TH className="text-right">OT</TH>
                  <TH className="text-right">Sản phẩm</TH>
                  <TH className="text-right">Phụ cấp</TH>
                  <TH className="text-right">Khấu trừ</TH>
                  <TH className="text-right">Thực lĩnh</TH>
                  <TH>Trạng thái</TH>
                </TR>
              </THead>
              <tbody>
                {filteredRows.map((r) => (
                  <TR
                    key={r.employee.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.employee.name} size={30} />
                        <div>
                          <div className="font-medium text-sm">
                            {r.employee.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {r.employee.code} · {r.employee.dept}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD className="text-right num">{r.workDays}</TD>
                    <TD className="text-right num">{r.ot}h</TD>
                    <TD className="text-right num text-muted-foreground">
                      {fmtVND(r.piecework)}
                    </TD>
                    <TD className="text-right num text-muted-foreground">
                      {fmtVND(r.allowance)}
                    </TD>
                    <TD className="text-right num text-destructive">
                      - {fmtVND(r.deductions)}
                    </TD>
                    <TD className="text-right num font-semibold">
                      {fmtVND(r.net)}
                    </TD>
                    <TD>
                      <Badge
                        variant={r.status === 'Confirmed' ? 'success' : 'secondary'}
                      >
                        {r.status === 'Confirmed' ? 'Đã xác nhận' : 'Bản nháp'}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </QueryState>
        </Card>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.employee.name}
        description={
          selected
            ? `${selected.employee.code} · ${selected.employee.role}`
            : undefined
        }
        width={520}
        footer={
          <>
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
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground">Thực lĩnh</div>
              <div className="text-3xl font-semibold num tracking-tight mt-1">
                {fmtVND(selected.net)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {period.name}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Chi tiết</div>
              <div className="rounded-lg border divide-y">
                <PayItem
                  label="Lương cơ bản (theo công)"
                  value={
                    selected.gross -
                    selected.ot * 120_000 -
                    selected.piecework -
                    selected.allowance
                  }
                />
                <PayItem
                  label={`OT (${selected.ot} giờ × 120.000 ₫)`}
                  value={selected.ot * 120_000}
                />
                <PayItem label="Lương sản phẩm" value={selected.piecework} />
                <PayItem label="Phụ cấp" value={selected.allowance} />
                <PayItem label="Tổng gộp" value={selected.gross} bold />
                <PayItem
                  label="Bảo hiểm & thuế TNCN"
                  value={-selected.deductions}
                  negative
                />
                <PayItem
                  label="Thực lĩnh"
                  value={selected.net}
                  bold
                  highlight
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Điều chỉnh thủ công</div>
                <Button variant="outline" size="sm">
                  <Plus className="size-4" /> Thêm dòng
                </Button>
              </div>
              <div className="rounded-lg border p-3 text-xs text-muted-foreground text-center">
                Chưa có điều chỉnh. POST /api/payrolls/{'{payrollId}'}/items
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {confirmNode}
    </div>
  )
}

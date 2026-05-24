import { useMemo, useState } from 'react'
import { Check, Clock, DollarSign, Download, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDesc, CardHeader, CardTitle } from '../components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Avatar } from '../components/ui/avatar'
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@/components/ui/table'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '../components/layout/page-header'
import { QueryState } from '../components/ui/query-state'
import { StatCard } from './dashboard'
import {
  usePayrollPeriods,
  usePayrollRows,
  usePayrollReport,
} from '@/hooks/usePayroll'
import { fmtNum, fmtVND } from '../lib/format'

interface CostBar {
  label: string
  value: number
  color: string
}

export function ReportsScreen() {
  const { data: periods = [] } = usePayrollPeriods()
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const periodId = selectedPeriodId ?? periods[0]?.id ?? null
  const {
    data: report,
    isLoading: reportLoading,
    error: reportError,
  } = usePayrollReport(periodId)
  const { data: rows = [] } = usePayrollRows(periodId)

  const topRows = useMemo(
    () => [...rows].sort((a, b) => b.netSalary - a.netSalary).slice(0, 8),
    [rows],
  )

  const costBars: CostBar[] = report
    ? [
        {
          label: 'Lương công',
          value: report.totalAttendanceSalary,
          color: 'var(--color-chart-1)',
        },
        {
          label: 'Lương SP',
          value: report.totalProductSalary,
          color: 'var(--color-chart-2)',
        },
        {
          label: 'OT',
          value: report.totalOvertimeSalary,
          color: 'var(--color-chart-3)',
        },
      ]
    : []
  const costBase = report?.totalGrossSalary || 1

  return (
    <div>
      <PageHeader
        title="Báo cáo"
        description="Thống kê chi tiết theo kỳ lương. /api/payroll-reports"
        actions={
          <>
            <Select
              value={periodId ?? undefined}
              onValueChange={setSelectedPeriodId}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Chọn kỳ lương" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="size-4" /> Xuất PDF
            </Button>
            <Button>
              <Download className="size-4" /> Xuất Excel
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Tổng chi"
          value={report ? fmtVND(report.totalNetSalary) : '—'}
          icon={DollarSign}
        />
        <StatCard
          label="Tổng gộp"
          value={report ? fmtVND(report.totalGrossSalary) : '—'}
          icon={Users}
        />
        <StatCard
          label="Số nhân viên"
          value={report ? fmtNum(report.employeeCount) : '—'}
          icon={Check}
        />
        <StatCard
          label="Tổng OT lương"
          value={report ? fmtVND(report.totalOvertimeSalary) : '—'}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Cơ cấu chi phí lương</CardTitle>
            <CardDesc>{report?.periodName ?? '—'}</CardDesc>
          </CardHeader>
          <CardBody>
            <QueryState isLoading={reportLoading} error={reportError}>
              {report ? (
                <div className="space-y-3 pt-2">
                  {costBars.map((b) => {
                    const w = (b.value / costBase) * 100
                    return (
                      <div key={b.label} className="flex items-center gap-3">
                        <div className="w-24 text-sm shrink-0 truncate">
                          {b.label}
                        </div>
                        <div className="flex-1 h-7 rounded bg-muted relative overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 transition-all"
                            style={{ width: `${w}%`, background: b.color }}
                          />
                          <div className="absolute inset-0 px-2 flex items-center text-xs font-medium num text-foreground/90">
                            {fmtVND(b.value)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu báo cáo.
                </div>
              )}
            </QueryState>
          </CardBody>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Top chi phí lương theo nhân viên</CardTitle>
              <CardDesc>Bao gồm OT và sản phẩm</CardDesc>
            </div>
            <Button variant="ghost" size="sm">
              Xem đầy đủ <ChevronRight className="size-3.5" />
            </Button>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hạng</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Mã NV</TableHead>
                <TableHead className="text-right">Lương SP</TableHead>
                <TableHead className="text-right">Thực lĩnh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topRows.map((r, i) => (
                <TableRow key={r.employeeId}>
                  <TableCell className="num text-muted-foreground">#{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.employeeName} size={28} />
                      <div className="font-medium text-sm">
                        {r.employeeName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.employeeCode}
                  </TableCell>
                  <TableCell className="text-right num text-muted-foreground">
                    {fmtVND(r.productSalary)}
                  </TableCell>
                  <TableCell className="text-right num font-semibold">
                    {fmtVND(r.netSalary)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}

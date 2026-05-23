import { useMemo, useState } from 'react'
import { Check, Clock, DollarSign, Download, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardDesc, CardHeader, CardTitle } from '../components/ui/card'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Avatar } from '../components/ui/avatar'
import {
  Table,
  THead,
  TH,
  TR,
  TD,
} from '../components/ui/table'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '../components/layout/page-header'
import { StatCard } from './dashboard'
import {
  useDepartments,
  usePayrollPeriods,
  usePayrollRows,
} from '../api/resources'
import { fmtNum, fmtVND } from '../lib/format'

interface CostShare {
  label: string
  value: number
  color: string
}

const COST_SHARE: CostShare[] = [
  { label: 'Lương cơ bản', value: 68, color: 'oklch(0.5635 0.2408 260.8178)' },
  { label: 'Lương sản phẩm', value: 18, color: 'oklch(0.62 0.19 260)' },
  { label: 'OT', value: 7, color: 'oklch(0.7 0.16 260)' },
  { label: 'Phụ cấp', value: 5, color: 'oklch(0.78 0.12 260)' },
  { label: 'Thưởng', value: 2, color: 'oklch(0.85 0.08 260)' },
]

export function ReportsScreen() {
  const { data: periods = [] } = usePayrollPeriods()
  const { data: departments = [] } = useDepartments()
  const [periodId, setPeriodId] = useState('p2')
  const period = periods.find((p) => p.id === periodId)
  const { data: rows = [] } = usePayrollRows(periodId)

  const deptBars = useMemo(
    () =>
      departments
        .filter((d) => d.status === 'Active')
        .map((d, i) => ({
          code: d.code,
          name: d.name,
          value:
            d.headcount * (d.code === 'PROD' ? 11_000_000 : 22_000_000) +
            ((i * 37) % 100) * 1_000_000,
        })),
    [departments],
  )

  const maxBar = Math.max(...deptBars.map((d) => d.value), 1)
  const topRows = [...rows].sort((a, b) => b.net - a.net).slice(0, 8)

  if (!period) return null

  return (
    <div>
      <PageHeader
        title="Báo cáo"
        description="Thống kê chi tiết theo kỳ lương. /api/payroll-reports"
        actions={
          <>
            <Select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              className="w-[260px]"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
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
          value={fmtVND(period.totalAmount ?? 2_940_000_000)}
          delta="3.6%"
          icon={DollarSign}
        />
        <StatCard
          label="Lương bình quân"
          value={fmtVND(
            Math.round(
              (period.totalAmount ?? 2_940_000_000) / period.employees,
            ),
          )}
          icon={Users}
        />
        <StatCard
          label="Số nhân viên"
          value={fmtNum(period.employees)}
          icon={Check}
        />
        <StatCard
          label="Tổng OT (giờ)"
          value="2.184"
          delta="2.1%"
          deltaKind="down"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Chi phí lương theo phòng ban</CardTitle>
            <CardDesc>{period.name}</CardDesc>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 pt-2">
              {deptBars.map((d) => {
                const w = (d.value / maxBar) * 100
                return (
                  <div key={d.code} className="flex items-center gap-3">
                    <div className="w-24 text-sm shrink-0 truncate">{d.name}</div>
                    <div className="flex-1 h-7 rounded bg-muted relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/85 transition-all"
                        style={{ width: `${w}%` }}
                      />
                      <div className="absolute inset-0 px-2 flex items-center text-xs font-medium num text-foreground/90">
                        {fmtVND(Math.round(d.value))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bổ chi phí</CardTitle>
            <CardDesc>Theo loại</CardDesc>
          </CardHeader>
          <CardBody className="space-y-3">
            {COST_SHARE.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="num font-medium">{s.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${s.value}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Top 10 chi phí lương theo nhân viên</CardTitle>
              <CardDesc>Bao gồm OT và sản phẩm</CardDesc>
            </div>
            <Button variant="ghost" size="sm">
              Xem đầy đủ <ChevronRight className="size-3.5" />
            </Button>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>Hạng</TH>
                <TH>Nhân viên</TH>
                <TH>Phòng ban</TH>
                <TH className="text-right">Công</TH>
                <TH className="text-right">OT</TH>
                <TH className="text-right">Sản phẩm</TH>
                <TH className="text-right">Thực lĩnh</TH>
              </TR>
            </THead>
            <tbody>
              {topRows.map((r, i) => (
                <TR key={r.employee.id}>
                  <TD className="num text-muted-foreground">#{i + 1}</TD>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.employee.name} size={28} />
                      <div className="font-medium text-sm">
                        {r.employee.name}
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Badge variant="outline">
                      {departments.find((d) => d.code === r.employee.dept)?.name ??
                        r.employee.dept}
                    </Badge>
                  </TD>
                  <TD className="text-right num">{r.workDays}</TD>
                  <TD className="text-right num">{r.ot}h</TD>
                  <TD className="text-right num text-muted-foreground">
                    {fmtVND(r.piecework)}
                  </TD>
                  <TD className="text-right num font-semibold">{fmtVND(r.net)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  )
}

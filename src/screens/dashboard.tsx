import { useMemo } from 'react'
import {
  Check,
  ChevronRight,
  DollarSign,
  Download,
  Plus,
  Users,
  AlertTriangle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardBody,
  CardDesc,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Tabs } from '../components/ui/tabs'
import { Avatar } from '../components/ui/avatar'
import { PageHeader } from '../components/layout/page-header'
import { useDepartments } from '@/hooks/useDepartments'
import { useAuditLogs } from '@/hooks/useAuditLogs'

interface StatCardProps {
  label: string
  value: string
  delta?: string
  deltaKind?: 'up' | 'down'
  icon: LucideIcon
  hint?: string
}

export function StatCard({
  label,
  value,
  delta,
  deltaKind = 'up',
  icon: Icon,
  hint,
}: StatCardProps) {
  return (
    <Card>
      <CardBody className="p-5">
        <div className="flex items-start justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Icon className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <div className="text-2xl font-semibold tracking-tight num">
            {value}
          </div>
          {delta && (
            <span
              className={
                deltaKind === 'up'
                  ? 'text-xs font-medium text-[oklch(0.55_0.18_145)]'
                  : 'text-xs font-medium text-destructive'
              }
            >
              {deltaKind === 'up' ? '↑' : '↓'} {delta}
            </span>
          )}
        </div>
        {hint && (
          <div className="text-xs text-muted-foreground mt-1">{hint}</div>
        )}
      </CardBody>
    </Card>
  )
}

function AttendanceChart() {
  const data = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) =>
        82 + Math.round(Math.sin(i / 2) * 9 + Math.cos(i / 3) * 4),
      ),
    [],
  )
  const w = 720
  const h = 220
  const pad = 28
  const max = 100
  const min = 60
  const pts = data.map((v, i): [number, number] => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1)
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2)
    return [x, y]
  })
  const path = 'M ' + pts.map((p) => p.join(' ')).join(' L ')
  const last = pts[pts.length - 1]
  const first = pts[0]
  const area =
    path + ` L ${last[0]} ${h - pad} L ${first[0]} ${h - pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[220px]">
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="oklch(0.5635 0.2408 260.8178)"
            stopOpacity="0.25"
          />
          <stop
            offset="100%"
            stopColor="oklch(0.5635 0.2408 260.8178)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      {[60, 70, 80, 90, 100].map((g) => {
        const y = h - pad - ((g - min) / (max - min)) * (h - pad * 2)
        return (
          <g key={g}>
            <line
              x1={pad}
              x2={w - pad}
              y1={y}
              y2={y}
              stroke="oklch(0.92 0 0)"
              strokeDasharray="2 4"
            />
            <text x={4} y={y + 3} className="fill-muted-foreground" style={{ fontSize: 10 }}>
              {g}%
            </text>
          </g>
        )
      })}
      <path d={area} fill="url(#ag)" />
      <path
        d={path}
        stroke="oklch(0.5635 0.2408 260.8178)"
        strokeWidth="2"
        fill="none"
      />
      {pts.map(
        ([x, y], i) =>
          i % 5 === 0 && (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="white"
              stroke="oklch(0.5635 0.2408 260.8178)"
              strokeWidth="1.5"
            />
          ),
      )}
    </svg>
  )
}

const PIPELINE: { step: string; done?: boolean; current?: boolean; desc: string }[] = [
  { step: 'Chấm công', done: true, desc: '194/196 nhân viên đã có dữ liệu' },
  { step: 'Sản lượng / công đoạn', done: true, desc: 'Đã nhập 1.842 dòng' },
  { step: 'Tạo bảng lương', current: true, desc: 'Sẵn sàng generate' },
  { step: 'Xác nhận & điều chỉnh', desc: '—' },
  { step: 'Khóa kỳ', desc: '—' },
  { step: 'Đánh dấu đã trả', desc: '—' },
]

export function DashboardScreen() {
  const { data: departments = [] } = useDepartments()
  const { data: logs = [] } = useAuditLogs()
  const recent = logs.slice(0, 6)
  const total = departments.reduce((s, d) => s + d.headcount, 0) || 216

  return (
    <div>
      <PageHeader
        title="Bảng điều khiển"
        description="Tổng quan nhanh: nhân sự, chấm công, lương tháng và hoạt động gần đây."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" /> Xuất báo cáo
            </Button>
            <Button>
              <Plus className="size-4" /> Tạo kỳ lương
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Tổng nhân viên"
          value={String(total)}
          delta="4 mới"
          icon={Users}
          hint="Đang làm việc"
        />
        <StatCard
          label="Có mặt hôm nay"
          value="198"
          delta="92%"
          icon={Check}
          hint="22/05/2026"
        />
        <StatCard
          label="Lương dự kiến T5"
          value="2.94 tỷ ₫"
          delta="3.6%"
          icon={DollarSign}
          hint="Kỳ PR-2026-05 đang mở"
        />
        <StatCard
          label="Yêu cầu chờ duyệt"
          value="12"
          delta="—"
          icon={AlertTriangle}
          hint="8 chấm công · 4 điều chỉnh"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Tỷ lệ chấm công 30 ngày</CardTitle>
              <CardDesc>Số nhân viên đi làm đầy đủ theo ngày</CardDesc>
            </div>
            <Tabs
              tabs={[
                { value: '30d', label: '30 ngày' },
                { value: '7d', label: '7 ngày' },
                { value: '24h', label: '24 giờ' },
              ]}
              value="30d"
              onChange={() => undefined}
            />
          </CardHeader>
          <CardBody>
            <AttendanceChart />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Luồng tính lương</CardTitle>
            <CardDesc>Trạng thái kỳ PR-2026-05</CardDesc>
          </CardHeader>
          <CardBody className="space-y-3">
            {PIPELINE.map((s, i) => (
              <div key={s.step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={
                      s.done
                        ? 'size-6 rounded-full grid place-items-center text-[11px] font-medium bg-primary text-primary-foreground'
                        : s.current
                          ? 'size-6 rounded-full grid place-items-center text-[11px] font-medium border-2 border-primary text-primary bg-background'
                          : 'size-6 rounded-full grid place-items-center text-[11px] font-medium bg-muted text-muted-foreground'
                    }
                  >
                    {s.done ? <Check className="size-3" /> : i + 1}
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div
                      className={
                        s.done ? 'w-px flex-1 bg-primary/40' : 'w-px flex-1 bg-border'
                      }
                    />
                  )}
                </div>
                <div className="pb-2">
                  <div
                    className={
                      s.current ? 'text-sm font-medium text-primary' : 'text-sm font-medium'
                    }
                  >
                    {s.step}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Headcount theo phòng ban</CardTitle>
              <CardDesc>Tỷ trọng nhân sự đang làm việc</CardDesc>
            </div>
            <Button variant="ghost" size="sm">
              Xem tất cả <ChevronRight className="size-3.5" />
            </Button>
          </CardHeader>
          <CardBody className="space-y-3">
            {departments
              .filter((d) => d.status === 'Active')
              .map((d) => {
                const pct = Math.round((d.headcount / total) * 100)
                return (
                  <div key={d.id} className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.code}</div>
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm font-medium num">
                      {d.headcount}
                    </div>
                    <div className="w-12 text-right text-xs text-muted-foreground num">
                      {pct}%
                    </div>
                  </div>
                )
              })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDesc>/api/audit-logs</CardDesc>
          </CardHeader>
          <CardBody className="space-y-3">
            {recent.map((log) => (
              <div key={log.id} className="flex gap-3">
                <Avatar name={log.actor} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">{log.actor}</span>{' '}
                    <span className="text-muted-foreground">
                      → {log.action?.replaceAll('_', ' ').toLowerCase()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {log.target}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {log.at ? log.at.slice(11, 16) : ''}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

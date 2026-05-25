import {
  Building2,
  Check,
  Download,
  Plus,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/layout/page-header'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import { usePayrollPeriods } from '@/hooks/usePayroll'
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
          <div className="size-8 rounded-none bg-primary/15 text-primary grid place-items-center">
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
                  ? 'text-xs font-medium text-success'
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

export function DashboardScreen() {
  const { data: employees = [] } = useEmployees()
  const { data: departments = [] } = useDepartments()
  const { data: periods = [] } = usePayrollPeriods()
  const { data: logs = [] } = useAuditLogs()

  const recent = logs.slice(0, 6)
  const activeCount = employees.filter((e) => e.status === 'Active').length

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
          value={String(employees.length)}
          icon={Users}
        />
        <StatCard
          label="Phòng ban"
          value={String(departments.length)}
          icon={Building2}
        />
        <StatCard
          label="Kỳ lương"
          value={String(periods.length)}
          icon={Wallet}
        />
        <StatCard
          label="Đang làm việc"
          value={String(activeCount)}
          icon={Check}
          hint="Nhân viên trạng thái Active"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {recent.map((log) => (
              <div key={log.id} className="flex gap-3 items-center">
                <Badge variant="muted">{log.module}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">{log.action}</span>{' '}
                    <span className="text-muted-foreground">{log.module}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {log.description}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {log.performedAtUtc
                    ? new Date(log.performedAtUtc).toLocaleTimeString('vi-VN')
                    : ''}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

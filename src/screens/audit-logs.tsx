import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge, badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'
import { QueryState } from '../components/ui/query-state'
import { PageHeader } from '../components/layout/page-header'
import { useAuditLogs } from '@/hooks/useAuditLogs'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

const ACTION_COLOR: Record<string, BadgeVariant> = {
  LOGIN: 'muted',
  EMPLOYEE_CREATE: 'success',
  EMPLOYEE_UPDATE_SALARY: 'warning',
  PAYROLL_LOCK: 'warning',
  PAYROLL_GENERATE: 'default',
  ATTENDANCE_BULK_IMPORT: 'default',
  ROLE_PERMISSION_UPDATE: 'warning',
  ACCOUNT_DISABLE: 'destructive',
}

export function AuditLogsScreen() {
  const { data: logs = [], isLoading, error } = useAuditLogs()
  const [fromDate, setFromDate] = useState('2026-05-15')
  const [toDate, setToDate] = useState('2026-05-22')
  const [actionFilter, setActionFilter] = useState('all')

  return (
    <div>
      <PageHeader
        title="Nhật ký hoạt động"
        description="Lịch sử thao tác trên toàn hệ thống."
        actions={
          <Button variant="outline">
            <Download className="size-4" /> Xuất Log
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b flex items-center gap-3 flex-wrap">
          <DatePicker
            value={fromDate}
            onChange={setFromDate}
            className="w-[160px]"
          />
          <span className="text-muted-foreground text-sm">→</span>
          <DatePicker value={toDate} onChange={setToDate} className="w-[160px]" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Mọi loại hành động" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi loại hành động</SelectItem>
              <SelectItem value="LOGIN">LOGIN</SelectItem>
              <SelectItem value="EMPLOYEE_*">EMPLOYEE_*</SelectItem>
              <SelectItem value="PAYROLL_*">PAYROLL_*</SelectItem>
              <SelectItem value="ATTENDANCE_*">ATTENDANCE_*</SelectItem>
              <SelectItem value="ACCOUNT_*">ACCOUNT_*</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <div className="text-xs text-muted-foreground num">
            {logs.length} dòng
          </div>
        </div>

        <QueryState isLoading={isLoading} error={error}>
          <div className="divide-y">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/30"
              >
                <div className="text-xs font-mono text-muted-foreground num pt-0.5 w-[160px] shrink-0">
                  {new Date(log.performedAtUtc).toLocaleString('vi-VN')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm flex items-center gap-2 flex-wrap">
                    <Badge variant={ACTION_COLOR[log.action] ?? 'muted'}>
                      {log.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.module}
                    </span>
                  </div>
                  <div className="text-sm mt-1">{log.description}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {log.entityName}
                    {log.entityId ? (
                      <span className="font-mono"> · {log.entityId.slice(0, 8)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </QueryState>
      </Card>
    </div>
  )
}

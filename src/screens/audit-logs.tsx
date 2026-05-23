import { Download, Eye } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Badge, type BadgeVariant } from '../components/ui/badge'
import { Avatar } from '../components/ui/avatar'
import { QueryState } from '../components/ui/query-state'
import { PageHeader } from '../components/layout/page-header'
import { useAccounts, useAuditLogs } from '../api/resources'

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
  const { data: accounts = [] } = useAccounts()

  return (
    <div>
      <PageHeader
        title="Nhật ký hoạt động"
        description="Lịch sử thao tác trên toàn hệ thống. /api/audit-logs"
        actions={
          <Button variant="outline">
            <Download className="size-4" /> Xuất Log
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b flex items-center gap-3 flex-wrap">
          <Input type="date" defaultValue="2026-05-15" className="w-[160px]" />
          <span className="text-muted-foreground text-sm">→</span>
          <Input type="date" defaultValue="2026-05-22" className="w-[160px]" />
          <Select className="w-[180px]" defaultValue="all">
            <option value="all">Mọi người dùng</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.username}>
                @{a.username}
              </option>
            ))}
          </Select>
          <Select className="w-[200px]" defaultValue="all">
            <option value="all">Mọi loại hành động</option>
            <option>LOGIN</option>
            <option>EMPLOYEE_*</option>
            <option>PAYROLL_*</option>
            <option>ATTENDANCE_*</option>
            <option>ACCOUNT_*</option>
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
                <div className="text-xs font-mono text-muted-foreground num pt-0.5 w-[140px] shrink-0">
                  {log.at}
                </div>
                <Avatar name={log.actor} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">@{log.actor}</span>{' '}
                    <Badge
                      variant={ACTION_COLOR[log.action] ?? 'muted'}
                      className="ml-1"
                    >
                      {log.action}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    Đối tượng:{' '}
                    <span className="text-foreground">{log.target}</span>
                  </div>
                </div>
                <div className="text-xs font-mono text-muted-foreground num pt-0.5 shrink-0">
                  {log.ip}
                </div>
                <Button variant="ghost" size="iconsm" aria-label="Xem">
                  <Eye className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </QueryState>
      </Card>
    </div>
  )
}

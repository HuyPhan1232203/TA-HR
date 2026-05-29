import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { ConfirmDialog, type ConfirmState } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { QueryState } from '../components/ui/query-state'
import { FilterBar, PageHeader } from '../components/layout/page-header'
import {
  useApproveOvertime,
  useOvertimeRequests,
  useRejectOvertime,
} from '@/hooks/useOvertime'
import { usePayrollPeriods } from '@/hooks/usePayroll'
import type { IOvertimeRequest, OvertimeStatus } from '../types/OvertimeType'
import { fmtDate } from '../lib/format'

const STATUS_LABELS: Record<OvertimeStatus, string> = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
}

const STATUS_VARIANTS: Record<
  OvertimeStatus,
  'secondary' | 'success' | 'destructive'
> = {
  Pending: 'secondary',
  Approved: 'success',
  Rejected: 'destructive',
}

export function OvertimeApprovalsScreen() {
  const [statusFilter, setStatusFilter] = useState<'all' | OvertimeStatus>(
    'Pending',
  )
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const {
    data: list = [],
    isLoading,
    error,
  } = useOvertimeRequests({
    status: statusFilter === 'all' ? undefined : statusFilter,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  })
  const { data: periods = [] } = usePayrollPeriods()

  const approveMut = useApproveOvertime()
  const rejectMut = useRejectOvertime()

  const [approving, setApproving] = useState<IOvertimeRequest | null>(null)
  const [compPeriodId, setCompPeriodId] = useState('')
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const openApprove = (r: IOvertimeRequest) => {
    setCompPeriodId('')
    setApproving(r)
  }

  const confirmApprove = async () => {
    if (!approving) return
    if (!compPeriodId) {
      toast.error('Chọn kỳ lương để bù giờ')
      return
    }
    try {
      await approveMut.mutateAsync({
        id: approving.id,
        data: { compensationPayrollPeriodId: compPeriodId },
      })
      toast.success('Đã duyệt đơn tăng ca')
      setApproving(null)
    } catch (e) {
      toast.error('Không thể duyệt đơn', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const reject = (r: IOvertimeRequest) => {
    setConfirmState({
      title: 'Từ chối đơn tăng ca?',
      description: `Từ chối đơn ${r.hours} giờ ngày ${fmtDate(r.workDate)}.`,
      danger: true,
      confirmText: 'Từ chối',
      onConfirm: () => {
        void (async () => {
          try {
            await rejectMut.mutateAsync(r.id)
            toast.success('Đã từ chối đơn')
          } catch (e) {
            toast.error('Không thể từ chối đơn', {
              description: e instanceof Error ? e.message : undefined,
            })
          }
        })()
      },
    })
  }

  return (
    <div>
      <PageHeader
        title="Duyệt tăng ca"
        description="Duyệt đơn tăng ca và chọn kỳ lương để bù giờ."
      />

      <Card>
        <FilterBar className="p-4 border-b mb-0">
          <div className="space-y-1.5">
            <Label className="text-xs">Trạng thái</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as 'all' | OvertimeStatus)
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Pending">Chờ duyệt</SelectItem>
                <SelectItem value="Approved">Đã duyệt</SelectItem>
                <SelectItem value="Rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Từ ngày</Label>
            <DatePicker value={fromDate} onChange={setFromDate} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Đến ngày</Label>
            <DatePicker value={toDate} onChange={setToDate} />
          </div>
        </FilterBar>
        <QueryState isLoading={isLoading} error={error}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Số giờ</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[200px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.employeeName ?? '—'}</div>
                    {r.employeeCode && (
                      <code className="text-xs font-mono text-muted-foreground">
                        {r.employeeCode}
                      </code>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{fmtDate(r.workDate)}</TableCell>
                  <TableCell className="num">{r.hours}</TableCell>
                  <TableCell className="text-sm">{r.reason}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[r.status] ?? 'secondary'}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.status === 'Pending' ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          onClick={() => openApprove(r)}
                          disabled={approveMut.isPending}
                        >
                          <Check className="size-4" /> Duyệt
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reject(r)}
                          disabled={rejectMut.isPending}
                        >
                          <X className="size-4" /> Từ chối
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-muted-foreground py-6"
                  >
                    Không có đơn tăng ca.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </QueryState>
      </Card>

      <Dialog
        open={!!approving}
        onOpenChange={(o) => {
          if (!o) setApproving(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt đơn tăng ca</DialogTitle>
            <DialogDescription>
              {approving
                ? `${approving.employeeName ?? ''} · ${approving.hours} giờ · ${fmtDate(approving.workDate)}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Kỳ lương bù giờ *</Label>
            <Select value={compPeriodId} onValueChange={setCompPeriodId}>
              <SelectTrigger>
                <SelectValue placeholder="— Chọn kỳ lương —" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>
              Hủy
            </Button>
            <Button
              onClick={() => void confirmApprove()}
              disabled={approveMut.isPending}
            >
              {approveMut.isPending ? 'Đang duyệt…' : 'Duyệt đơn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(o) => {
          if (!o) setConfirmState(null)
        }}
        title={confirmState?.title ?? ''}
        description={confirmState?.description}
        danger={confirmState?.danger}
        confirmText={confirmState?.confirmText}
        onConfirm={() => {
          confirmState?.onConfirm()
          setConfirmState(null)
        }}
      />
    </div>
  )
}

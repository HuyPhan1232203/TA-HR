import { useState } from 'react'
import { LogIn, LogOut, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { QueryState } from '../components/ui/query-state'
import { PageHeader } from '../components/layout/page-header'
import {
  useCheckIn,
  useCheckOut,
  useCreateAdjustmentRequest,
  useMyAdjustmentRequests,
} from '@/hooks/useMyAttendance'
import type {
  AdjustmentRequestStatus,
  AdjustmentRequestType,
} from '@/types/MyAttendanceType'
import { fmtDate } from '../lib/format'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

const REQUEST_LABELS: Record<AdjustmentRequestType, string> = {
  LateArrival: 'Đi muộn',
  EarlyLeave: 'Về sớm',
}

const STATUS_LABELS: Record<AdjustmentRequestStatus, string> = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
}

const STATUS_VARIANTS: Record<
  AdjustmentRequestStatus,
  'secondary' | 'success' | 'destructive'
> = {
  Pending: 'secondary',
  Approved: 'success',
  Rejected: 'destructive',
}

const today = () => new Date().toISOString().slice(0, 10)

export function MyAttendanceScreen() {
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()
  const { data: requests = [], isLoading, error } = useMyAdjustmentRequests()
  const createRequest = useCreateAdjustmentRequest()

  const [workDate, setWorkDate] = useState(today())
  const [requestType, setRequestType] =
    useState<AdjustmentRequestType>('LateArrival')
  const [requestedTime, setRequestedTime] = useState('')
  const [reason, setReason] = useState('')

  const doCheckIn = async () => {
    try {
      await checkIn.mutateAsync()
      toast.success('Đã check-in')
    } catch (e) {
      toast.error('Check-in thất bại', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const doCheckOut = async () => {
    try {
      await checkOut.mutateAsync()
      toast.success('Đã check-out')
    } catch (e) {
      toast.error('Check-out thất bại', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const submitRequest = async () => {
    if (!workDate) {
      toast.error('Chọn ngày')
      return
    }
    if (!TIME_RE.test(requestedTime)) {
      toast.error('Giờ không hợp lệ', { description: 'Định dạng HH:mm' })
      return
    }
    if (!reason.trim()) {
      toast.error('Nhập lý do')
      return
    }
    try {
      await createRequest.mutateAsync({
        workDate,
        requestType,
        requestedTime,
        reason: reason.trim(),
      })
      toast.success('Đã gửi đơn')
      setRequestedTime('')
      setReason('')
    } catch (e) {
      toast.error('Không thể gửi đơn', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Chấm công của tôi"
        description="Check-in/check-out và gửi đơn đi muộn / về sớm."
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Chấm công hôm nay</CardTitle>
          </CardHeader>
          <CardBody className="flex gap-3">
            <Button
              className="flex-1"
              onClick={doCheckIn}
              disabled={checkIn.isPending}
            >
              <LogIn className="size-4" /> Check-in
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={doCheckOut}
              disabled={checkOut.isPending}
            >
              <LogOut className="size-4" /> Check-out
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đơn đi muộn / về sớm</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Ngày</Label>
                <DatePicker value={workDate} onChange={setWorkDate} />
              </div>
              <div className="space-y-1.5">
                <Label>Loại đơn</Label>
                <Select
                  value={requestType}
                  onValueChange={(v) =>
                    setRequestType(v as AdjustmentRequestType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LateArrival">Đi muộn</SelectItem>
                    <SelectItem value="EarlyLeave">Về sớm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Giờ (HH:mm)</Label>
                <Input
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  placeholder="08:15"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Lý do</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Kẹt xe…"
                rows={2}
              />
            </div>
            <Button onClick={submitRequest} disabled={createRequest.isPending}>
              <Send className="size-4" /> Gửi đơn
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Đơn của tôi</CardTitle>
        </CardHeader>
        <QueryState isLoading={isLoading} error={error}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Loại đơn</TableHead>
                <TableHead>Giờ</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Gửi lúc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{fmtDate(r.workDate)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {REQUEST_LABELS[r.requestType] ?? r.requestType}
                    </Badge>
                  </TableCell>
                  <TableCell className="num">{r.requestedTime}</TableCell>
                  <TableCell className="text-sm">{r.reason}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[r.status] ?? 'secondary'}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.requestedAtUtc ? fmtDate(r.requestedAtUtc) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-muted-foreground py-6"
                  >
                    Chưa có đơn nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </QueryState>
      </Card>
    </div>
  )
}

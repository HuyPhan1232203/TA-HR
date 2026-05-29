import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { QueryState } from '../components/ui/query-state'
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog, type ConfirmState } from '@/components/ui/confirm-dialog'
import { PageHeader } from '../components/layout/page-header'
import {
  useCreateShiftConfig,
  useDeleteShiftConfig,
  useShiftConfigs,
} from '@/hooks/useShifts'
import type { IAttendanceShiftConfig } from '@/types/ShiftType'
import TableWrapper from '@/components/ui/table-wrapper'

interface SessionRow {
  checkIn: string
  checkOut: string
}

export function ShiftConfigsScreen() {
  const { data: list = [], isLoading, error } = useShiftConfigs()
  const createMut = useCreateShiftConfig()
  const removeMut = useDeleteShiftConfig()

  const [open, setOpen] = useState(false)
  const [shiftCode, setShiftCode] = useState('')
  const [name, setName] = useState('')
  const [sessions, setSessions] = useState<SessionRow[]>([
    { checkIn: '08:00', checkOut: '12:00' },
  ])
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const openCreate = () => {
    setShiftCode('')
    setName('')
    setSessions([{ checkIn: '08:00', checkOut: '12:00' }])
    setOpen(true)
  }

  const setSession = (i: number, patch: Partial<SessionRow>) =>
    setSessions((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))

  const save = async () => {
    if (!shiftCode || !name) {
      toast.error('Nhập mã ca và tên ca')
      return
    }
    if (sessions.some((s) => !s.checkIn || !s.checkOut)) {
      toast.error('Mỗi phiên cần đủ giờ vào / giờ ra')
      return
    }
    try {
      await createMut.mutateAsync({ shiftCode, name, sessions })
      toast.success('Đã tạo cấu hình ca', { description: shiftCode })
      setOpen(false)
    } catch (e) {
      toast.error('Không thể tạo cấu hình ca', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const remove = (c: IAttendanceShiftConfig) => {
    setConfirmState({
      title: 'Xóa cấu hình ca?',
      description: `Ca "${c.name}" (${c.shiftCode}) sẽ bị xóa.`,
      danger: true,
      confirmText: 'Xóa',
      onConfirm: () => {
        void (async () => {
          try {
            await removeMut.mutateAsync(c.id)
            toast.success('Đã xóa cấu hình ca')
          } catch (e) {
            toast.error('Không thể xóa', {
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
        title="Cấu hình ca"
        description="Khai báo ca làm việc và các phiên để tự tính giờ công."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Thêm ca
          </Button>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Mã ca</TableHead>
                <TableHead>Tên ca</TableHead>
                <TableHead>Phiên làm việc</TableHead>
                <TableHead className="text-right">Tổng giờ</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <code className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded">
                      {c.shiftCode}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.sessions.map((s) => (
                        <Badge key={s.sessionOrder} variant="secondary">
                          {s.checkIn}–{s.checkOut}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right num font-medium">
                    {c.totalHours}h
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Xóa"
                        onClick={() => remove(c)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground py-6"
                  >
                    Chưa có cấu hình ca nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </QueryState>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm cấu hình ca</DialogTitle>
            <DialogDescription>
              Mỗi phiên là một khoảng giờ làm; tổng giờ do backend tính.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mã ca *</Label>
                <Input
                  value={shiftCode}
                  onChange={(e) => setShiftCode(e.target.value)}
                  placeholder="VD: CA1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tên ca *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Ca 1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Phiên làm việc</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSessions((s) => [
                      ...s,
                      { checkIn: '13:00', checkOut: '17:00' },
                    ])
                  }
                >
                  <Plus className="size-4" /> Thêm phiên
                </Button>
              </div>
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={s.checkIn}
                    onChange={(e) => setSession(i, { checkIn: e.target.value })}
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="time"
                    value={s.checkOut}
                    onChange={(e) => setSession(i, { checkOut: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Xóa phiên"
                    disabled={sessions.length === 1}
                    onClick={() =>
                      setSessions((arr) => arr.filter((_, idx) => idx !== i))
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={save} disabled={createMut.isPending}>
              Lưu
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

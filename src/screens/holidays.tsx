import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
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
  useHolidays,
  useCreateHoliday,
  useDeleteHoliday,
} from '@/hooks/useHolidays'
import type { IHoliday } from '../types/HolidayType'
import { fmtDate } from '../lib/format'

const YEAR = new Date().getFullYear()

export function HolidaysScreen() {
  const [fromDate, setFromDate] = useState(`${YEAR}-01-01`)
  const [toDate, setToDate] = useState(`${YEAR}-12-31`)
  const { data: list = [], isLoading, error } = useHolidays({ fromDate, toDate })

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [isPaidLeave, setIsPaidLeave] = useState('true')
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const createMut = useCreateHoliday()
  const removeMut = useDeleteHoliday()

  const create = async () => {
    if (!name || !date) {
      toast.error('Vui lòng nhập tên và ngày')
      return
    }
    try {
      await createMut.mutateAsync({
        name,
        date,
        isPaidLeave: isPaidLeave === 'true',
      })
      toast.success('Đã thêm ngày lễ', { description: name })
      setName('')
      setDate('')
      setIsPaidLeave('true')
      setOpen(false)
    } catch (e) {
      toast.error('Không thể thêm ngày lễ', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const remove = (h: IHoliday) => {
    setConfirmState({
      title: 'Xóa ngày lễ?',
      description: `Xóa "${h.name}" (${fmtDate(h.date)}).`,
      danger: true,
      confirmText: 'Xóa',
      onConfirm: () => {
        void (async () => {
          try {
            await removeMut.mutateAsync(h.id)
            toast.success('Đã xóa ngày lễ', { description: h.name })
          } catch (e) {
            toast.error('Không thể xóa ngày lễ', {
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
        title="Ngày lễ"
        description="Lịch nghỉ lễ — ảnh hưởng công chuẩn của kỳ lương."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Thêm ngày lễ
          </Button>
        }
      />

      <Card>
        <FilterBar className="p-4 border-b mb-0">
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
                <TableHead>Ngày</TableHead>
                <TableHead>Tên ngày lễ</TableHead>
                <TableHead>Loại nghỉ</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">
                    {fmtDate(h.date)}
                  </TableCell>
                  <TableCell>{h.name}</TableCell>
                  <TableCell>
                    <Badge variant={h.isPaidLeave ? 'success' : 'secondary'}>
                      {h.isPaidLeave ? 'Nghỉ có lương' : 'Nghỉ không lương'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Xóa"
                      onClick={() => remove(h)}
                      disabled={removeMut.isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueryState>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm ngày lễ</DialogTitle>
            <DialogDescription>
              Ngày nghỉ có lương sẽ giảm công chuẩn của kỳ lương tương ứng.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên ngày lễ *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tết Dương lịch"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ngày *</Label>
                <DatePicker value={date} onChange={setDate} />
              </div>
              <div className="space-y-1.5">
                <Label>Loại nghỉ</Label>
                <Select value={isPaidLeave} onValueChange={setIsPaidLeave}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Nghỉ có lương</SelectItem>
                    <SelectItem value="false">Nghỉ không lương</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void create()} disabled={createMut.isPending}>
              {createMut.isPending ? 'Đang lưu…' : 'Thêm'}
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

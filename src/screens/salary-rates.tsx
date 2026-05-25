import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { QueryState } from '../components/ui/query-state'
import { Empty } from '../components/ui/empty'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { ConfirmDialog, type ConfirmState } from '@/components/ui/confirm-dialog'
import { PageHeader } from '../components/layout/page-header'
import { useEmployees } from '@/hooks/useEmployees'
import {
  useCreateEmployeeSalaryRate,
  useDeleteEmployeeSalaryRate,
  useEmployeeSalaryRates,
  useUpdateEmployeeSalaryRate,
} from '@/hooks/useEmployeeSalaryRates'
import type { IEmployeeSalaryRate } from '@/types/EmployeeSalaryRateType'
import type { SalaryCalculationType } from '@/types/EmployeeType'
import { fmtDate, fmtVND } from '../lib/format'

const CALC_TYPES: SalaryCalculationType[] = [
  'FixedMonthly',
  'DailyWage',
  'HourlyWage',
  'ProductBased',
  'Mixed',
]

const CALC_LABELS: Record<SalaryCalculationType, string> = {
  FixedMonthly: 'Lương tháng cố định',
  DailyWage: 'Lương theo công',
  HourlyWage: 'Lương theo giờ',
  ProductBased: 'Lương sản phẩm',
  Mixed: 'Lương hỗn hợp',
}

// Which rate fields apply to each calculation type (guide §8.5)
function fields(t: SalaryCalculationType) {
  return {
    monthly: t === 'FixedMonthly' || t === 'Mixed' || t === 'ProductBased',
    daily: t === 'DailyWage' || t === 'Mixed' || t === 'ProductBased',
    hourly: t === 'HourlyWage' || t === 'Mixed' || t === 'ProductBased',
  }
}

interface Editable {
  id: string
  calculationType: SalaryCalculationType
  monthlySalary: string
  dailyRate: string
  hourlyRate: string
  effectiveFrom: string
  effectiveTo: string
  isActive: boolean
}

const blank: Editable = {
  id: '',
  calculationType: 'FixedMonthly',
  monthlySalary: '',
  dailyRate: '',
  hourlyRate: '',
  effectiveFrom: '',
  effectiveTo: '',
  isActive: true,
}

const numOrNull = (s: string) => (s.trim() === '' ? null : Number(s) || 0)

export function SalaryRatesScreen() {
  const { data: employees = [] } = useEmployees()
  const [searchParams] = useSearchParams()
  const [employeeId, setEmployeeId] = useState(
    searchParams.get('employeeId') ?? '',
  )
  const {
    data: rates = [],
    isLoading,
    error,
  } = useEmployeeSalaryRates(employeeId || undefined)

  const createMut = useCreateEmployeeSalaryRate()
  const updateMut = useUpdateEmployeeSalaryRate()
  const removeMut = useDeleteEmployeeSalaryRate()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Editable>(blank)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const openCreate = () => {
    setEditing({ ...blank })
    setOpen(true)
  }

  const openEdit = (r: IEmployeeSalaryRate) => {
    setEditing({
      id: r.id,
      calculationType: r.calculationType,
      monthlySalary: r.monthlySalary?.toString() ?? '',
      dailyRate: r.dailyRate?.toString() ?? '',
      hourlyRate: r.hourlyRate?.toString() ?? '',
      effectiveFrom: r.effectiveFrom,
      effectiveTo: r.effectiveTo ?? '',
      isActive: r.isActive,
    })
    setOpen(true)
  }

  const validate = (): string | null => {
    if (!employeeId) return 'Chọn nhân viên trước'
    if (!editing.effectiveFrom) return 'Nhập ngày hiệu lực'
    const m = numOrNull(editing.monthlySalary) ?? 0
    const d = numOrNull(editing.dailyRate) ?? 0
    const h = numOrNull(editing.hourlyRate) ?? 0
    switch (editing.calculationType) {
      case 'FixedMonthly':
        return m > 0 ? null : 'Nhập lương tháng'
      case 'DailyWage':
        return d > 0 ? null : 'Nhập đơn giá ngày công'
      case 'HourlyWage':
        return h > 0 ? null : 'Nhập đơn giá giờ'
      case 'Mixed':
        return m > 0 || d > 0 || h > 0
          ? null
          : 'Lương hỗn hợp cần ít nhất một giá trị > 0'
      default:
        return null
    }
  }

  const save = async () => {
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    const f = fields(editing.calculationType)
    const payload = {
      calculationType: editing.calculationType,
      monthlySalary: f.monthly ? numOrNull(editing.monthlySalary) : null,
      dailyRate: f.daily ? numOrNull(editing.dailyRate) : null,
      hourlyRate: f.hourly ? numOrNull(editing.hourlyRate) : null,
      effectiveFrom: editing.effectiveFrom,
      effectiveTo: editing.effectiveTo || null,
    }
    try {
      if (editing.id) {
        await updateMut.mutateAsync({
          id: editing.id,
          data: { ...payload, isActive: editing.isActive },
        })
        toast.success('Đã cập nhật định mức lương')
      } else {
        await createMut.mutateAsync({ employeeId, ...payload })
        toast.success('Đã thêm định mức lương')
      }
      setOpen(false)
    } catch (e) {
      toast.error('Lỗi', {
        description: e instanceof Error ? e.message : 'Không thể lưu',
      })
    }
  }

  const remove = (r: IEmployeeSalaryRate) => {
    setConfirmState({
      title: 'Xóa định mức lương?',
      description: `Dòng hiệu lực từ ${fmtDate(r.effectiveFrom)} sẽ bị xóa.`,
      danger: true,
      confirmText: 'Xóa',
      onConfirm: () => {
        void (async () => {
          try {
            await removeMut.mutateAsync(r.id)
            toast.success('Đã xóa định mức lương')
          } catch (e) {
            toast.error('Lỗi', {
              description: e instanceof Error ? e.message : 'Không thể xóa',
            })
          }
        })()
      },
    })
  }

  const f = fields(editing.calculationType)

  return (
    <div>
      <PageHeader
        title="Định mức lương"
        description="Lịch sử định mức lương theo nhân viên và thời gian hiệu lực."
        actions={
          <Button onClick={openCreate} disabled={!employeeId}>
            <Plus className="size-4" /> Thêm định mức
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b">
          <div className="max-w-md space-y-1.5">
            <Label>Nhân viên</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="— Chọn nhân viên để xem định mức —" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.code} — {e.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!employeeId ? (
          <Empty
            title="Chưa chọn nhân viên"
            desc="Chọn một nhân viên để xem lịch sử định mức lương."
          />
        ) : (
          <QueryState isLoading={isLoading} error={error}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hình thức</TableHead>
                  <TableHead className="text-right">Lương tháng</TableHead>
                  <TableHead className="text-right">Đơn giá ngày</TableHead>
                  <TableHead className="text-right">Đơn giá giờ</TableHead>
                  <TableHead>Hiệu lực</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {CALC_LABELS[r.calculationType]}
                    </TableCell>
                    <TableCell className="text-right num">
                      {fmtVND(r.monthlySalary)}
                    </TableCell>
                    <TableCell className="text-right num">
                      {fmtVND(r.dailyRate)}
                    </TableCell>
                    <TableCell className="text-right num">
                      {fmtVND(r.hourlyRate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(r.effectiveFrom)} → {fmtDate(r.effectiveTo)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isActive ? 'success' : 'muted'}>
                        {r.isActive ? 'Đang áp dụng' : 'Hết hiệu lực'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Sửa"
                          onClick={() => openEdit(r)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Xóa"
                          onClick={() => remove(r)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </QueryState>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing.id ? 'Sửa định mức lương' : 'Thêm định mức lương'}
            </DialogTitle>
            <DialogDescription>
              Chỉ cần nhập ngày bắt đầu — backend tự đóng dòng trước đó và giới
              hạn ngày kết thúc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Hình thức tính lương *</Label>
              <Select
                value={editing.calculationType}
                onValueChange={(v) =>
                  setEditing({
                    ...editing,
                    calculationType: v as SalaryCalculationType,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {CALC_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {f.monthly ? (
                <div className="space-y-1.5">
                  <Label>Lương tháng</Label>
                  <Input
                    type="number"
                    className="num"
                    value={editing.monthlySalary}
                    onChange={(e) =>
                      setEditing({ ...editing, monthlySalary: e.target.value })
                    }
                  />
                </div>
              ) : null}
              {f.daily ? (
                <div className="space-y-1.5">
                  <Label>Đơn giá ngày</Label>
                  <Input
                    type="number"
                    className="num"
                    value={editing.dailyRate}
                    onChange={(e) =>
                      setEditing({ ...editing, dailyRate: e.target.value })
                    }
                  />
                </div>
              ) : null}
              {f.hourly ? (
                <div className="space-y-1.5">
                  <Label>Đơn giá giờ</Label>
                  <Input
                    type="number"
                    className="num"
                    value={editing.hourlyRate}
                    onChange={(e) =>
                      setEditing({ ...editing, hourlyRate: e.target.value })
                    }
                  />
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hiệu lực từ *</Label>
                <DatePicker
                  value={editing.effectiveFrom}
                  onChange={(v) => setEditing({ ...editing, effectiveFrom: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hiệu lực đến</Label>
                <DatePicker
                  value={editing.effectiveTo}
                  onChange={(v) => setEditing({ ...editing, effectiveTo: v })}
                />
              </div>
            </div>

            {editing.id ? (
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select
                  value={editing.isActive ? 'active' : 'inactive'}
                  onValueChange={(v) =>
                    setEditing({ ...editing, isActive: v === 'active' })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang áp dụng</SelectItem>
                    <SelectItem value="inactive">Hết hiệu lực</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={save}
              disabled={createMut.isPending || updateMut.isPending}
            >
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

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Eye, Plus, Search } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Badge } from '../components/ui/badge'
import { Avatar } from '../components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { DataTable } from '../components/ui/data-table'
import { QueryState } from '../components/ui/query-state'
import { FilterBar, PageHeader } from '../components/layout/page-header'
import { toast } from 'sonner'
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
} from '@/hooks/useEmployees'
import { useDepartments } from '@/hooks/useDepartments'
import type {
  EmployeeStatus,
  IEmployee,
  SalaryCalculationType,
} from '@/types/EmployeeType'

type DrawerMode = 'create' | 'edit'

interface DrawerState {
  mode: DrawerMode
  employee: IEmployee
}

const SALARY_TYPES: SalaryCalculationType[] = [
  'FixedMonthly',
  'DailyWage',
  'HourlyWage',
  'ProductBased',
  'Mixed',
]

const SALARY_LABELS: Record<SalaryCalculationType, string> = {
  FixedMonthly: 'Lương tháng cố định',
  DailyWage: 'Lương theo công',
  HourlyWage: 'Lương theo giờ',
  ProductBased: 'Lương sản phẩm',
  Mixed: 'Lương hỗn hợp',
}

const blankEmployee: IEmployee = {
  id: '',
  code: '',
  fullName: '',
  departmentId: '',
  positionName: '',
  salaryCalculationType: 'FixedMonthly',
  status: 'Active',
  bankAccountNumber: '',
  bankAccountName: '',
  bankBranchName: '',
  bankPartnerEmail: '',
}

export function EmployeesScreen() {
  const { data: list = [], isLoading, error } = useEmployees()
  const { data: departments = [] } = useDepartments()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [deptFilter, setDeptFilter] = useState(
    searchParams.get('departmentId') ?? 'all',
  )
  const [statusFilter, setStatusFilter] = useState<'all' | EmployeeStatus>(
    (searchParams.get('status') as EmployeeStatus | null) ?? 'all',
  )
  const [drawer, setDrawer] = useState<DrawerState | null>(null)

  const createMut = useCreateEmployee()
  const updateMut = useUpdateEmployee()

  const deptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? '—'

  const filtered = useMemo(
    () =>
      list.filter(
        (e) =>
          (!q ||
            e.fullName.toLowerCase().includes(q.toLowerCase()) ||
            e.code.toLowerCase().includes(q.toLowerCase())) &&
          (deptFilter === 'all' || e.departmentId === deptFilter) &&
          (statusFilter === 'all' || e.status === statusFilter),
      ),
    [list, q, deptFilter, statusFilter],
  )

  const onSave = async (emp: IEmployee) => {
    try {
      if (drawer?.mode === 'create') {
        // POST /api/employees has no status — strip id + status
        const { id: _id, status: _status, ...rest } = emp
        void _id
        void _status
        await createMut.mutateAsync(rest)
        toast.success('Đã tạo nhân viên', { description: emp.fullName })
      } else {
        await updateMut.mutateAsync({ id: emp.id, data: emp })
        toast.success('Đã cập nhật', { description: emp.fullName })
      }
      setDrawer(null)
    } catch (err) {
      toast.error('Lỗi', {
        description: err instanceof Error ? err.message : 'Không thể lưu',
      })
    }
  }

  const columns = useMemo<ColumnDef<IEmployee>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Nhân viên',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.original.fullName} size={34} />
            <div>
              <div className="font-medium">{row.original.fullName}</div>
              <code className="text-xs font-mono text-muted-foreground">
                {row.original.code}
              </code>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'departmentId',
        header: 'Phòng ban',
        cell: ({ row }) => (
          <Badge variant="outline">{deptName(row.original.departmentId)}</Badge>
        ),
      },
      {
        accessorKey: 'positionName',
        header: 'Chức danh',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.positionName}</span>
        ),
      },
      {
        accessorKey: 'salaryCalculationType',
        header: 'Hình thức lương',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {SALARY_LABELS[row.original.salaryCalculationType]}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'Active' ? 'success' : 'muted'}>
            {row.original.status === 'Active' ? 'Đang làm' : 'Ngừng'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Xem hồ sơ"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/employees/${row.original.id}`)
              }}
            >
              <Eye className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [departments],
  )

  return (
    <div>
      <PageHeader
        title="Nhân viên"
        description="Hồ sơ nhân viên."
        actions={
          <Button
            onClick={() =>
              setDrawer({ mode: 'create', employee: { ...blankEmployee } })
            }
          >
            <Plus className="size-4" /> Thêm nhân viên
          </Button>
        }
      />

      <Card>
        <FilterBar className="p-4 border-b mb-0">
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo mã, tên…"
              className="pl-8 w-[280px]"
            />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tất cả phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as 'all' | EmployeeStatus)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mọi trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="Active">Đang làm việc</SelectItem>
              <SelectItem value="Inactive">Ngừng</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" size="sm">
            <Download className="size-4" /> Xuất CSV
          </Button>
        </FilterBar>

        <QueryState isLoading={isLoading} error={error}>
          <DataTable<IEmployee>
            columns={columns}
            data={filtered}
            onRowClick={(emp) => setDrawer({ mode: 'edit', employee: emp })}
            emptyMessage="Chưa có nhân viên nào"
          />
        </QueryState>
      </Card>

      <EmployeeDrawer
        key={drawer ? `${drawer.mode}-${drawer.employee.id}` : 'closed'}
        drawer={drawer}
        onClose={() => setDrawer(null)}
        onSave={onSave}
        saving={createMut.isPending || updateMut.isPending}
      />
    </div>
  )
}

interface EmployeeDrawerProps {
  drawer: DrawerState | null
  onClose: () => void
  onSave: (emp: IEmployee) => void
  saving: boolean
}

function EmployeeDrawer({ drawer, onClose, onSave, saving }: EmployeeDrawerProps) {
  const { data: departments = [] } = useDepartments()
  const [form, setForm] = useState<IEmployee | null>(drawer?.employee ?? null)

  if (!drawer || !form) return null

  return (
    <Sheet
      open
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="flex flex-col p-0"
      >
        <SheetHeader>
          <SheetTitle>
            {drawer.mode === 'create' ? 'Thêm nhân viên' : form.fullName}
          </SheetTitle>
          <SheetDescription>
            {drawer.mode === 'create'
              ? 'Tạo hồ sơ nhân viên mới'
              : `Mã NV ${form.code}`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4">
          <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-none">
          <Avatar name={form.fullName || '?'} size={56} />
          <div className="flex-1">
            <div className="font-medium">{form.fullName || 'Nhân viên mới'}</div>
            <div className="text-xs text-muted-foreground">
              {form.positionName || 'Chưa có chức danh'}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Mã nhân viên *</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Họ và tên *</Label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phòng ban</Label>
            <Select
              value={form.departmentId || undefined}
              onValueChange={(v) => setForm({ ...form, departmentId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="— Chọn phòng ban —" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Chức danh</Label>
            <Input
              value={form.positionName}
              onChange={(e) =>
                setForm({ ...form, positionName: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hình thức lương</Label>
            <Select
              value={form.salaryCalculationType}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  salaryCalculationType: v as SalaryCalculationType,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALARY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {SALARY_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm({ ...form, status: v as EmployeeStatus })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Đang làm việc</SelectItem>
                <SelectItem value="Inactive">Ngừng</SelectItem>
                <SelectItem value="Resigned">Đã nghỉ việc</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
          <div className="pt-2">
            <div className="text-sm font-medium mb-2">Thông tin ngân hàng</div>
            <div className="text-xs text-muted-foreground mb-3">
              Dùng cho xuất file chuyển khoản lương.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Số tài khoản</Label>
                <Input
                  value={form.bankAccountNumber ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, bankAccountNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tên chủ tài khoản</Label>
                <Input
                  value={form.bankAccountName ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, bankAccountName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Chi nhánh</Label>
                <Input
                  value={form.bankBranchName ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, bankBranchName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email nhận uỷ nhiệm chi</Label>
                <Input
                  type="email"
                  value={form.bankPartnerEmail ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, bankPartnerEmail: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving}>
            Lưu thay đổi
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

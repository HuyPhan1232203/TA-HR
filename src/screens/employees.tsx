import { useMemo, useState } from 'react'
import {
  Download,
  Info,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import {
  Card as CardP,
  CardBody,
  CardDesc,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Avatar } from '../components/ui/avatar'
import { Drawer } from '../components/ui/drawer'
import { Tabs } from '../components/ui/tabs'
import {
  Table,
  THead,
  TH,
  TR,
  TD,
} from '../components/ui/table'
import { DataTable } from '../components/ui/data-table'
import { QueryState } from '../components/ui/query-state'
import { FilterBar, PageHeader } from '../components/layout/page-header'
import { useToast } from '../components/ui/toast'
import {
  QK,
  employeeMutations,
  useApiMutation,
  useDepartments,
  useEmployees,
  useOperations,
  useRoles,
} from '../api/resources'
import type { Employee, EmployeeStatus } from '../types/domain'
import { fmtDate, fmtVND } from '../lib/format'

type DrawerMode = 'create' | 'edit'

interface DrawerState {
  mode: DrawerMode
  employee: Employee
}

const blankEmployee: Employee = {
  id: '',
  code: '',
  name: '',
  dept: 'ENG',
  role: '',
  email: '',
  phone: '',
  status: 'Active',
  joinedAt: '',
  salary: 0,
}

type EmployeeTab = 'profile' | 'account' | 'salary'

export function EmployeesScreen() {
  const toast = useToast()
  const { data: list = [], isLoading, error } = useEmployees()
  const { data: departments = [] } = useDepartments()
  const [q, setQ] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | EmployeeStatus>(
    'all',
  )
  const [drawer, setDrawer] = useState<DrawerState | null>(null)

  const createMut = useApiMutation(
    (payload: Omit<Employee, 'id'>) => employeeMutations.create(payload),
    { invalidate: [QK.employees] },
  )
  const updateMut = useApiMutation(
    (vars: { id: string; payload: Partial<Employee> }) =>
      employeeMutations.update(vars.id, vars.payload),
    { invalidate: [QK.employees] },
  )

  const filtered = useMemo(
    () =>
      list.filter(
        (e) =>
          (!q ||
            e.name.toLowerCase().includes(q.toLowerCase()) ||
            e.code.toLowerCase().includes(q.toLowerCase()) ||
            e.email.toLowerCase().includes(q.toLowerCase())) &&
          (deptFilter === 'all' || e.dept === deptFilter) &&
          (statusFilter === 'all' || e.status === statusFilter),
      ),
    [list, q, deptFilter, statusFilter],
  )

  const onSave = async (emp: Employee) => {
    try {
      if (drawer?.mode === 'create') {
        const { id: _id, ...rest } = emp
        void _id
        await createMut.mutateAsync(rest)
        toast({ title: 'Đã tạo nhân viên', desc: emp.name })
      } else {
        await updateMut.mutateAsync({ id: emp.id, payload: emp })
        toast({ title: 'Đã cập nhật', desc: emp.name })
      }
      setDrawer(null)
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Lỗi',
        desc: err instanceof Error ? err.message : 'Không thể lưu',
      })
    }
  }

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nhân viên',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.original.name} size={34} />
            <div>
              <div className="font-medium">{row.original.name}</div>
              <div className="text-xs text-muted-foreground">
                Vào làm {fmtDate(row.original.joinedAt)}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Mã',
        cell: ({ row }) => (
          <code className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded">
            {row.original.code}
          </code>
        ),
      },
      {
        accessorKey: 'dept',
        header: 'Phòng ban',
        cell: ({ row }) => (
          <Badge variant="outline">
            {departments.find((d) => d.code === row.original.dept)?.name ??
              row.original.dept}
          </Badge>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Chức danh',
        cell: ({ row }) => <span className="text-sm">{row.original.role}</span>,
      },
      {
        id: 'contact',
        header: 'Liên hệ',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground">
            <div>{row.original.email}</div>
            <div>{row.original.phone}</div>
          </div>
        ),
      },
      {
        accessorKey: 'salary',
        header: () => <div className="text-right">Lương cơ bản</div>,
        cell: ({ row }) => (
          <div className="text-right num font-medium">
            {fmtVND(row.original.salary)}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => {
          const s = row.original.status
          return (
            <Badge
              variant={
                s === 'Active' ? 'success' : s === 'Onleave' ? 'warning' : 'muted'
              }
            >
              {s === 'Active' ? 'Đang làm' : s === 'Onleave' ? 'Nghỉ phép' : 'Đã nghỉ'}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: () => (
          <Button variant="ghost" size="iconsm" aria-label="More">
            <MoreHorizontal className="size-4" />
          </Button>
        ),
      },
    ],
    [departments],
  )

  return (
    <div>
      <PageHeader
        title="Nhân viên"
        description="Hồ sơ, tài khoản và đơn giá lương. /api/employees"
        actions={
          <>
            <Button variant="outline">
              <Upload className="size-4" /> Nhập Excel
            </Button>
            <Button
              onClick={() =>
                setDrawer({ mode: 'create', employee: { ...blankEmployee } })
              }
            >
              <Plus className="size-4" /> Thêm nhân viên
            </Button>
          </>
        }
      />

      <Card>
        <FilterBar className="p-4 border-b mb-0">
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo mã, tên, email…"
              className="pl-8 w-[280px]"
            />
          </div>
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-[180px]"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.code}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | EmployeeStatus)
            }
            className="w-[160px]"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="Active">Đang làm việc</option>
            <option value="Onleave">Nghỉ phép</option>
            <option value="Resigned">Đã nghỉ việc</option>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" size="sm">
            <Download className="size-4" /> Xuất CSV
          </Button>
        </FilterBar>

        <QueryState isLoading={isLoading} error={error}>
          <DataTable<Employee>
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
  onSave: (emp: Employee) => void
  saving: boolean
}

function EmployeeDrawer({ drawer, onClose, onSave, saving }: EmployeeDrawerProps) {
  const { data: departments = [] } = useDepartments()
  const { data: roles = [] } = useRoles()
  const { data: operations = [] } = useOperations()
  const [tab, setTab] = useState<EmployeeTab>('profile')
  const [form, setForm] = useState<Employee | null>(drawer?.employee ?? null)

  if (!drawer || !form) return null

  return (
    <Drawer
      open
      onClose={onClose}
      title={drawer.mode === 'create' ? 'Thêm nhân viên' : form.name}
      description={
        drawer.mode === 'create'
          ? 'Tạo hồ sơ nhân viên mới'
          : `Mã NV ${form.code} · ${departments.find((d) => d.code === form.dept)?.name ?? ''}`
      }
      width={620}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving}>
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <Tabs<EmployeeTab>
        tabs={[
          { value: 'profile', label: 'Hồ sơ' },
          { value: 'account', label: 'Tài khoản' },
          { value: 'salary', label: 'Lương' },
        ]}
        value={tab}
        onChange={setTab}
        className="mb-5"
      />

      {tab === 'profile' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-lg">
            <Avatar name={form.name || '?'} size={56} />
            <div className="flex-1">
              <div className="font-medium">{form.name || 'Nhân viên mới'}</div>
              <div className="text-xs text-muted-foreground">
                {form.role || 'Chưa có chức danh'}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Upload className="size-4" /> Ảnh đại diện
            </Button>
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
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email công ty</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phòng ban</Label>
              <Select
                value={form.dept}
                onChange={(e) => setForm({ ...form, dept: e.target.value })}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Chức danh</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ngày vào làm</Label>
              <Input
                type="date"
                value={form.joinedAt}
                onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as EmployeeStatus })
                }
              >
                <option value="Active">Đang làm việc</option>
                <option value="Onleave">Nghỉ phép</option>
                <option value="Resigned">Đã nghỉ việc</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea placeholder="Ghi chú nội bộ về nhân viên…" />
          </div>
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3.5 flex items-start gap-3">
            <Info className="size-4 mt-0.5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              Tài khoản cho phép nhân viên đăng nhập hệ thống. Cần quyền{' '}
              <code className="font-mono">accounts.manage</code> để chỉnh sửa.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tên đăng nhập</Label>
              <Input defaultValue={form.code.toLowerCase().replace('nv', 'u')} />
            </div>
            <div className="space-y-1.5">
              <Label>Email đăng nhập</Label>
              <Input defaultValue={form.email} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md">
              {roles.map((r) => {
                const checked = r.code === 'employee'
                return (
                  <label
                    key={r.id}
                    className={
                      checked
                        ? 'flex items-center gap-2 px-2.5 py-1 rounded-md border cursor-pointer text-sm bg-primary/10 border-primary/30 text-primary'
                        : 'flex items-center gap-2 px-2.5 py-1 rounded-md border cursor-pointer text-sm hover:bg-muted'
                    }
                  >
                    <input
                      type="checkbox"
                      defaultChecked={checked}
                      className="rounded"
                    />
                    {r.name}
                  </label>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mật khẩu khởi tạo</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label>Yêu cầu đổi lần đầu</Label>
              <Select defaultValue="yes">
                <option value="yes">Có</option>
                <option value="no">Không</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      {tab === 'salary' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Lương cơ bản</Label>
            <div className="relative">
              <Input
                className="num"
                value={form.salary}
                onChange={(e) =>
                  setForm({ ...form, salary: Number(e.target.value) || 0 })
                }
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₫/tháng
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Hình thức lương</Label>
              <Select defaultValue="monthly">
                <option value="monthly">Lương tháng</option>
                <option value="piece">Lương sản phẩm</option>
                <option value="hybrid">Hỗn hợp</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hiệu lực từ</Label>
              <Input type="date" defaultValue="2026-01-01" />
            </div>
          </div>
          <CardP>
            <CardHeader>
              <CardTitle className="text-sm">Đơn giá theo công đoạn</CardTitle>
              <CardDesc>/api/employee-salary-rates/{form.id || '{id}'}</CardDesc>
            </CardHeader>
            <CardBody>
              <Table>
                <THead>
                  <TR>
                    <TH>Công đoạn</TH>
                    <TH className="text-right">Đơn giá</TH>
                    <TH />
                  </TR>
                </THead>
                <tbody>
                  {operations.slice(0, 3).map((op) => (
                    <TR key={op.id}>
                      <TD className="text-sm">{op.name}</TD>
                      <TD className="text-right num">{fmtVND(2500)}</TD>
                      <TD />
                    </TR>
                  ))}
                </tbody>
              </Table>
              <Button variant="outline" size="sm" className="mt-3 w-full">
                <Plus className="size-4" /> Thêm công đoạn
              </Button>
            </CardBody>
          </CardP>
        </div>
      )}
    </Drawer>
  )
}

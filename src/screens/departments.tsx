import { useMemo, useState } from 'react'
import { Download, Edit, Filter, Plus, Search, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Modal } from '../components/ui/modal'
import { useConfirm } from '../components/ui/confirm'
import { toast } from 'sonner'
import { DataTable } from '../components/ui/data-table'
import { QueryState } from '../components/ui/query-state'
import { PageHeader } from '../components/layout/page-header'
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import type { Department } from '../types/domain'

interface EditableDepartment {
  id?: string
  code: string
  name: string
  status: 'Active' | 'Inactive'
  manager: string
}

const blankDepartment: EditableDepartment = {
  code: '',
  name: '',
  status: 'Active',
  manager: '',
}

export function DepartmentsScreen() {
  const { confirm, node: confirmNode } = useConfirm()
  const { data: list = [], isLoading, error } = useDepartments()
  const { data: employees = [] } = useEmployees()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EditableDepartment>(blankDepartment)

  const createMut = useCreateDepartment()
  const updateMut = useUpdateDepartment()
  const removeMut = useDeleteDepartment()

  const filtered = useMemo(
    () =>
      list.filter(
        (d) =>
          !q ||
          d.code.toLowerCase().includes(q.toLowerCase()) ||
          d.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [list, q],
  )

  const openCreate = () => {
    setEditing({ ...blankDepartment })
    setOpen(true)
  }
  const openEdit = (d: Department) => {
    setEditing({
      id: d.id,
      code: d.code,
      name: d.name,
      status: d.status,
      manager: d.manager,
    })
    setOpen(true)
  }

  const save = async () => {
    if (!editing.code || !editing.name) {
      toast.error('Thiếu thông tin', {
        description: 'Code và tên phòng ban là bắt buộc.',
      })
      return
    }
    try {
      if (editing.id) {
        await updateMut.mutateAsync({
          id: editing.id,
          data: {
            code: editing.code,
            name: editing.name,
            status: editing.status,
            manager: editing.manager,
          },
        })
        toast.success('Đã cập nhật phòng ban', { description: editing.name })
      } else {
        await createMut.mutateAsync({
          code: editing.code,
          name: editing.name,
          status: editing.status,
          manager: editing.manager,
        })
        toast.success('Đã tạo phòng ban', { description: editing.name })
      }
      setOpen(false)
    } catch (err) {
      toast.error('Lỗi', {
        description: err instanceof Error ? err.message : 'Không thể lưu',
      })
    }
  }

  const remove = async (d: Department) => {
    const ok = await confirm({
      title: 'Xóa phòng ban?',
      body: `Phòng ban "${d.name}" sẽ bị xóa. Hành động này không thể hoàn tác.`,
      danger: true,
      confirmText: 'Xóa',
    })
    if (!ok) return
    try {
      await removeMut.mutateAsync(d.id)
      toast.success('Đã xóa', { description: d.name })
    } catch (err) {
      toast.error('Lỗi', {
        description: err instanceof Error ? err.message : 'Không thể xóa',
      })
    }
  }

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
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
        accessorKey: 'name',
        header: 'Tên phòng ban',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'manager',
        header: 'Quản lý',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.manager}</span>
        ),
      },
      {
        accessorKey: 'headcount',
        header: () => <div className="text-right">Nhân sự</div>,
        cell: ({ row }) => (
          <div className="text-right num">{row.original.headcount}</div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'Active' ? 'success' : 'muted'}>
            {row.original.status === 'Active' ? 'Đang hoạt động' : 'Ngừng'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="iconsm"
              onClick={(e) => {
                e.stopPropagation()
                openEdit(row.original)
              }}
              aria-label="Sửa"
            >
              <Edit className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="iconsm"
              onClick={(e) => {
                e.stopPropagation()
                void remove(row.original)
              }}
              aria-label="Xóa"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div>
      <PageHeader
        title="Phòng ban"
        description="Quản lý cơ cấu phòng ban. /api/departments"
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Thêm phòng ban
          </Button>
        }
      />

      <Card>
        <div className="p-4 flex items-center justify-between gap-3 border-b">
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo mã hoặc tên…"
              className="pl-8 w-[300px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="size-4" /> Lọc
            </Button>
            <Button variant="outline" size="sm">
              <Download className="size-4" /> Xuất CSV
            </Button>
          </div>
        </div>

        <QueryState isLoading={isLoading} error={error}>
          <DataTable<Department>
            columns={columns}
            data={filtered}
            emptyMessage="Chưa có phòng ban nào"
          />
        </QueryState>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing.id ? 'Sửa phòng ban' : 'Thêm phòng ban'}
        description="Mã phòng ban dùng tham chiếu duy nhất trong hệ thống."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={save}
              disabled={createMut.isPending || updateMut.isPending}
            >
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mã phòng ban *</Label>
              <Input
                value={editing.code}
                onChange={(e) =>
                  setEditing({ ...editing, code: e.target.value.toUpperCase() })
                }
                placeholder="VD: HR"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select
                value={editing.status}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    status: e.target.value as 'Active' | 'Inactive',
                  })
                }
              >
                <option value="Active">Đang hoạt động</option>
                <option value="Inactive">Ngừng</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tên phòng ban *</Label>
            <Input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Tên đầy đủ"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quản lý</Label>
            <Select
              value={editing.manager}
              onChange={(e) =>
                setEditing({ ...editing, manager: e.target.value })
              }
            >
              <option value="">— Chưa gán —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.name}>
                  {e.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
      {confirmNode}
    </div>
  )
}

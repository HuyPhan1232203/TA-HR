import { useMemo, useState } from 'react'
import { Download, Edit, Filter, Plus, Search, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog, type ConfirmState } from '@/components/ui/confirm-dialog'
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
import type { IDepartment } from '@/types/DepartmentType'

interface EditableDepartment {
  id?: string
  code: string
  name: string
  isActive: boolean
}

const blankDepartment: EditableDepartment = {
  code: '',
  name: '',
  isActive: true,
}

export function DepartmentsScreen() {
  const { data: list = [], isLoading, error } = useDepartments()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EditableDepartment>(blankDepartment)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

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
  const openEdit = (d: IDepartment) => {
    setEditing({ id: d.id, code: d.code, name: d.name, isActive: d.isActive })
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
            isActive: editing.isActive,
          },
        })
        toast.success('Đã cập nhật phòng ban', { description: editing.name })
      } else {
        await createMut.mutateAsync({
          code: editing.code,
          name: editing.name,
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

  const remove = (d: IDepartment) => {
    setConfirmState({
      title: 'Xóa phòng ban?',
      description: `Phòng ban "${d.name}" sẽ bị xóa. Hành động này không thể hoàn tác.`,
      danger: true,
      confirmText: 'Xóa',
      onConfirm: () => {
        void (async () => {
          try {
            await removeMut.mutateAsync(d.id)
            toast.success('Đã xóa', { description: d.name })
          } catch (err) {
            toast.error('Lỗi', {
              description: err instanceof Error ? err.message : 'Không thể xóa',
            })
          }
        })()
      },
    })
  }

  const columns = useMemo<ColumnDef<IDepartment>[]>(
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
        accessorKey: 'isActive',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'muted'}>
            {row.original.isActive ? 'Đang hoạt động' : 'Ngừng'}
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
              size="icon-sm"
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
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                remove(row.original)
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
          <DataTable<IDepartment>
            columns={columns}
            data={filtered}
            emptyMessage="Chưa có phòng ban nào"
          />
        </QueryState>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing.id ? 'Sửa phòng ban' : 'Thêm phòng ban'}
            </DialogTitle>
            <DialogDescription>
              Mã phòng ban dùng tham chiếu duy nhất trong hệ thống.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mã phòng ban *</Label>
                <Input
                  value={editing.code}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="VD: HR"
                />
              </div>
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
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="inactive">Ngừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tên phòng ban *</Label>
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                placeholder="Tên đầy đủ"
              />
            </div>
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

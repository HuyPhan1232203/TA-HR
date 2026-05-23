import { useState } from 'react'
import { Edit, Plus, Search } from 'lucide-react'
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
import { Avatar } from '../components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { PageHeader } from '../components/layout/page-header'
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
} from '@/hooks/useAccounts'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import { useRoles } from '@/hooks/useRoles'
import type {
  AccountStatus,
  IAccount,
  ICreateAccount,
  IUpdateAccount,
} from '@/types/AccountType'
import { cn } from '../lib/utils'

interface EditableAccount {
  id?: string
  username: string
  fullName: string
  employeeId: string | null
  roleIds: string[]
  status: AccountStatus
  password: string
  confirmPassword: string
}

const blank: EditableAccount = {
  username: '',
  fullName: '',
  employeeId: null,
  roleIds: [],
  status: 'Active',
  password: '',
  confirmPassword: '',
}

export function AccountsScreen() {
  const { data: list = [], isLoading, error } = useAccounts()
  const { data: employees = [] } = useEmployees()
  const { data: roles = [] } = useRoles()
  const { data: departments = [] } = useDepartments()
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EditableAccount>(blank)

  const filtered = list.filter(
    (a) =>
      (!q ||
        a.username.toLowerCase().includes(q.toLowerCase()) ||
        a.fullName.toLowerCase().includes(q.toLowerCase())) &&
      (roleFilter === 'all' || a.roles.includes(roleFilter)) &&
      (statusFilter === 'all' || a.status === statusFilter),
  )

  const startEdit = (a: IAccount) =>
    setEditing({
      id: a.id,
      username: a.username,
      fullName: a.fullName,
      employeeId: a.employeeId,
      // a.roles are role CODES → map to role IDS for the checkboxes
      roleIds: a.roles
        .map((code) => roles.find((r) => r.code === code)?.id)
        .filter((id): id is string => Boolean(id)),
      status: a.status,
      password: '',
      confirmPassword: '',
    })

  const save = async () => {
    try {
      if (editing.id) {
        const data: IUpdateAccount = {
          username: editing.username,
          fullName: editing.fullName,
          employeeId: editing.employeeId,
          roleIds: editing.roleIds,
          status: editing.status,
        }
        await updateAccount.mutateAsync({ id: editing.id, data })
        toast.success('Đã cập nhật tài khoản')
      } else {
        const data: ICreateAccount = {
          username: editing.username,
          fullName: editing.fullName,
          employeeId: editing.employeeId,
          roleIds: editing.roleIds,
          status: editing.status,
          ...(editing.password ? { password: editing.password } : {}),
        }
        await createAccount.mutateAsync(data)
        toast.success('Đã tạo tài khoản')
      }
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra')
    }
  }

  return (
    <div>
      <PageHeader
        title="Tài khoản"
        description="Quản lý tài khoản đăng nhập và liên kết với nhân viên. /api/accounts"
        actions={
          <Button
            onClick={() => {
              setEditing({ ...blank })
              setOpen(true)
            }}
          >
            <Plus className="size-4" /> Thêm tài khoản
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b flex items-center gap-3">
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm tài khoản, nhân viên…"
              className="pl-8 w-[280px]"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mọi vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi vai trò</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.code}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mọi trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="Active">Đang hoạt động</SelectItem>
              <SelectItem value="Inactive">Khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <QueryState isLoading={isLoading} error={error}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tài khoản</TableHead>
                <TableHead>Nhân viên liên kết</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => {
                const emp = employees.find((e) => e.id === a.employeeId)
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={a.fullName} size={32} />
                        <div>
                          <div className="font-medium">@{a.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.fullName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {emp ? (
                        <div className="text-sm">
                          <div>{emp.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {emp.code} ·{' '}
                            {departments.find((d) => d.id === emp.departmentId)
                              ?.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          — Không liên kết —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {a.roles.map((rc) => {
                          const r = roles.find((x) => x.code === rc)
                          return (
                            <Badge
                              key={rc}
                              variant={rc === 'admin' ? 'default' : 'outline'}
                            >
                              {r?.name ?? rc}
                            </Badge>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={a.status === 'Active' ? 'success' : 'destructive'}
                      >
                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            a.status === 'Active'
                              ? 'bg-[oklch(0.55_0.18_145)]'
                              : 'bg-destructive',
                          )}
                        />
                        {a.status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Sửa"
                        onClick={() => {
                          startEdit(a)
                          setOpen(true)
                        }}
                      >
                        <Edit className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </QueryState>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing.id ? 'Sửa tài khoản' : 'Tạo tài khoản'}
            </DialogTitle>
            <DialogDescription>
              Liên kết với nhân viên và gán vai trò.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tên đăng nhập *</Label>
              <Input
                value={editing.username}
                onChange={(e) =>
                  setEditing({ ...editing, username: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Họ và tên *</Label>
              <Input
                value={editing.fullName}
                onChange={(e) =>
                  setEditing({ ...editing, fullName: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Liên kết nhân viên</Label>
            <Select
              value={editing.employeeId ?? 'none'}
              onValueChange={(v) =>
                setEditing({
                  ...editing,
                  employeeId: v === 'none' ? null : v,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="— Không liên kết —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Không liên kết —</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.code} — {e.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md">
              {roles.map((r) => {
                const checked = editing.roleIds.includes(r.id)
                return (
                  <label
                    key={r.id}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-1 rounded-md border cursor-pointer text-sm',
                      checked
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'hover:bg-muted',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          roleIds: e.target.checked
                            ? [...editing.roleIds, r.id]
                            : editing.roleIds.filter((x) => x !== r.id),
                        })
                      }
                      className="rounded"
                    />
                    {r.name}
                  </label>
                )
              })}
            </div>
          </div>
          {!editing.id && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mật khẩu</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={editing.password}
                  onChange={(e) =>
                    setEditing({ ...editing, password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Xác nhận mật khẩu</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={editing.confirmPassword}
                  onChange={(e) =>
                    setEditing({ ...editing, confirmPassword: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select
              value={editing.status}
              onValueChange={(v) =>
                setEditing({ ...editing, status: v as AccountStatus })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Đang hoạt động</SelectItem>
                <SelectItem value="Inactive">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={save}
              disabled={createAccount.isPending || updateAccount.isPending}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

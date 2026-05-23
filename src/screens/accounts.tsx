import { useState } from 'react'
import { Edit, Plus, Search } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Avatar } from '../components/ui/avatar'
import { Modal } from '../components/ui/modal'
import { useToast } from '../components/ui/toast'
import {
  Table,
  THead,
  TH,
  TR,
  TD,
} from '../components/ui/table'
import { QueryState } from '../components/ui/query-state'
import { PageHeader } from '../components/layout/page-header'
import {
  useAccounts,
  useDepartments,
  useEmployees,
  useRoles,
} from '../api/resources'
import type { Account, AccountStatus } from '../types/domain'
import { cn } from '../lib/utils'

interface EditableAccount {
  id?: string
  username: string
  fullName: string
  employee: string
  roles: string[]
  status: AccountStatus
}

const blank: EditableAccount = {
  username: '',
  fullName: '',
  employee: '',
  roles: [],
  status: 'Active',
}

export function AccountsScreen() {
  const toast = useToast()
  const { data: list = [], isLoading, error } = useAccounts()
  const { data: employees = [] } = useEmployees()
  const { data: roles = [] } = useRoles()
  const { data: departments = [] } = useDepartments()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EditableAccount>(blank)

  const filtered = list.filter(
    (a) =>
      !q ||
      a.username.includes(q.toLowerCase()) ||
      a.fullName.toLowerCase().includes(q.toLowerCase()),
  )

  const startEdit = (a: Account) =>
    setEditing({
      id: a.id,
      username: a.username,
      fullName: a.fullName,
      employee: a.employee ?? '',
      roles: a.roles,
      status: a.status,
    })

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
          <Select className="w-[160px]" defaultValue="all">
            <option value="all">Mọi vai trò</option>
            {roles.map((r) => (
              <option key={r.id} value={r.code}>
                {r.name}
              </option>
            ))}
          </Select>
          <Select className="w-[160px]" defaultValue="all">
            <option value="all">Mọi trạng thái</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Disabled">Khóa</option>
          </Select>
        </div>
        <QueryState isLoading={isLoading} error={error}>
          <Table>
            <THead>
              <TR>
                <TH>Tài khoản</TH>
                <TH>Nhân viên liên kết</TH>
                <TH>Vai trò</TH>
                <TH>Trạng thái</TH>
                <TH>Đăng nhập gần nhất</TH>
                <TH className="w-[80px]" />
              </TR>
            </THead>
            <tbody>
              {filtered.map((a) => {
                const emp = employees.find((e) => e.id === a.employee)
                return (
                  <TR key={a.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={a.fullName} size={32} />
                        <div>
                          <div className="font-medium">@{a.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.fullName}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      {emp ? (
                        <div className="text-sm">
                          <div>{emp.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {emp.code} ·{' '}
                            {departments.find((d) => d.code === emp.dept)?.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          — Không liên kết —
                        </span>
                      )}
                    </TD>
                    <TD>
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
                    </TD>
                    <TD>
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
                    </TD>
                    <TD className="text-xs text-muted-foreground num">
                      {a.lastLogin}
                    </TD>
                    <TD>
                      <Button
                        variant="ghost"
                        size="iconsm"
                        aria-label="Sửa"
                        onClick={() => {
                          startEdit(a)
                          setOpen(true)
                        }}
                      >
                        <Edit className="size-4" />
                      </Button>
                    </TD>
                  </TR>
                )
              })}
            </tbody>
          </Table>
        </QueryState>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing.id ? 'Sửa tài khoản' : 'Tạo tài khoản'}
        description="Liên kết với nhân viên và gán vai trò."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: editing.id ? 'Đã cập nhật' : 'Đã tạo tài khoản',
                })
                setOpen(false)
              }}
            >
              Lưu
            </Button>
          </>
        }
      >
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
              value={editing.employee}
              onChange={(e) =>
                setEditing({ ...editing, employee: e.target.value })
              }
            >
              <option value="">— Không liên kết —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} — {e.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md">
              {roles.map((r) => {
                const checked = editing.roles.includes(r.code)
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
                          roles: e.target.checked
                            ? [...editing.roles, r.code]
                            : editing.roles.filter((x) => x !== r.code),
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
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label>Xác nhận mật khẩu</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select
              value={editing.status}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  status: e.target.value as AccountStatus,
                })
              }
            >
              <option value="Active">Đang hoạt động</option>
              <option value="Disabled">Đã khóa</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

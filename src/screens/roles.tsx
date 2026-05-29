import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Edit, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardBody,
  CardDesc,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { QueryState } from '../components/ui/query-state'
import { PageHeader } from '../components/layout/page-header'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRoles, useUpdateRole } from '@/hooks/useRoles'
import { useAccounts } from '@/hooks/useAccounts'
import type { IPermission } from '@/types/PermissionType'
import type { IRole } from '@/types/RoleType'
import { cn } from '../lib/utils'

export function RolesScreen() {
  const { data: roles = [], isLoading, error } = useRoles()
  const { data: permissions = [] } = usePermissions()

  // Group flat permissions by module client-side.
  const groups = useMemo(() => {
    const map = new Map<string, IPermission[]>()
    for (const p of permissions) {
      const arr = map.get(p.module) ?? []
      arr.push(p)
      map.set(p.module, arr)
    }
    return Array.from(map.entries())
  }, [permissions])

  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string>(
    searchParams.get('roleId') ?? '',
  )
  const selected = roles.find((r) => r.id === selectedId) ?? roles[0]

  return (
    <div>
      <PageHeader
        title="Vai trò & quyền"
        description="Phân quyền theo module."
        actions={
          <Button>
            <Plus className="size-4" /> Tạo vai trò
          </Button>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        <div className="grid grid-cols-[300px_1fr] gap-4">
          <Card>
            <div className="p-4 border-b">
              <div className="text-sm font-medium">Danh sách vai trò</div>
              <Input placeholder="Tìm vai trò…" className="mt-2 h-8" />
            </div>
            <div className="p-2 max-h-[600px] overflow-y-auto scrollbar-thin">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-none transition-colors',
                    selected?.id === r.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{r.name}</div>
                    <div className="flex items-center gap-1">
                      {r.isSystem && <Badge variant="muted">Hệ thống</Badge>}
                      <Badge variant={r.isActive ? 'success' : 'destructive'}>
                        {r.isActive ? 'Hoạt động' : 'Tắt'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <code className="font-mono">{r.code}</code>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {selected ? (
            <PermissionEditor
              key={selected.id}
              role={selected}
              groups={groups}
              permissions={permissions}
            />
          ) : (
            <Card>
              <CardBody>
                <CardDesc>Chọn một vai trò để xem phân quyền.</CardDesc>
              </CardBody>
            </Card>
          )}
        </div>
      </QueryState>
    </div>
  )
}

interface PermissionEditorProps {
  role: IRole
  groups: [string, IPermission[]][]
  permissions: IPermission[]
}

function PermissionEditor({ role, groups, permissions }: PermissionEditorProps) {
  const updateRole = useUpdateRole()
  const { data: accounts = [] } = useAccounts()
  const accountCount = accounts.filter((a) =>
    a.roles.includes(role.code),
  ).length

  // Local editable set of granted permission CODES, seeded from the role.
  // Remounted via `key={role.id}` upstream, so the initializer reseeds on
  // role change without a synchronizing effect.
  const [grants, setGrants] = useState<Set<string>>(
    () => new Set(role.permissions),
  )

  const toggle = (code: string) => {
    setGrants((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const save = async () => {
    // Map checked permission CODES → permission IDS for the write payload.
    const permissionIds = permissions
      .filter((p) => grants.has(p.code))
      .map((p) => p.id)
    try {
      await updateRole.mutateAsync({
        id: role.id,
        data: {
          name: role.name,
          isActive: role.isActive,
          permissionIds,
        },
      })
      toast.success('Đã lưu phân quyền', { description: role.name })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra')
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{role.name}</CardTitle>
            <CardDesc>
              <code className="font-mono">{role.code}</code>
              {role.isSystem ? ' · Vai trò hệ thống' : ''}
            </CardDesc>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/system/accounts?role=${role.code}`}>
                Tài khoản với vai trò này ({accountCount})
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="size-4" /> Sửa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium">Phân quyền theo module</div>
          <div className="text-xs text-muted-foreground">
            {grants.size} / {permissions.length} quyền
          </div>
        </div>
        <div className="space-y-4">
          {groups.map(([module, perms]) => {
            const granted = perms.filter((p) => grants.has(p.code)).length
            const all = granted === perms.length && granted > 0
            return (
              <div key={module} className="border rounded-none">
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-b">
                  <div>
                    <div className="font-medium text-sm">{module}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {module}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={all ? 'success' : granted > 0 ? 'warning' : 'muted'}
                    >
                      {granted}/{perms.length}
                    </Badge>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={all}
                        onChange={() => {
                          setGrants((prev) => {
                            const next = new Set(prev)
                            if (all)
                              perms.forEach((p) => next.delete(p.code))
                            else perms.forEach((p) => next.add(p.code))
                            return next
                          })
                        }}
                      />
                      Chọn tất cả
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 p-2">
                  {perms.map((p) => {
                    const checked = grants.has(p.code)
                    return (
                      <label
                        key={p.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-none cursor-pointer text-sm transition-colors',
                          checked ? 'bg-primary/5' : 'hover:bg-muted',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.code)}
                          className="rounded shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block truncate">{p.name}</span>
                          <code className="block font-mono text-[11px] text-muted-foreground truncate">
                            {p.code}
                          </code>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>
      <div className="flex justify-end gap-2 p-4 border-t bg-muted/20">
        <Button variant="outline">Hủy</Button>
        <Button onClick={save} disabled={updateRole.isPending}>
          Lưu phân quyền
        </Button>
      </div>
    </Card>
  )
}

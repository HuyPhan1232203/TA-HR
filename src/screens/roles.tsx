import { useMemo, useState } from 'react'
import { Edit, Plus, Trash2 } from 'lucide-react'
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
import { usePermissionGroups } from '@/hooks/usePermissions'
import { useRoles } from '@/hooks/useRoles'
import { cn } from '../lib/utils'

const DEFAULT_GRANTS: Record<string, string[]> = {
  r1: [],
  r2: [
    'hr.departments.manage',
    'hr.departments.read',
    'hr.employees.manage',
    'hr.employees.read',
    'accounts.read',
  ],
  r3: [
    'payroll.read',
    'payroll.periods.read',
    'payroll.periods.manage',
    'payroll.generate',
    'payroll.confirm',
    'payroll.reports.read',
    'hr.employees.read',
  ],
  r4: [
    'hr.employees.read',
    'attendance.read',
    'attendance.manage',
    'production.products.manage',
    'payroll.read',
  ],
  r5: ['hr.employees.read', 'payroll.read', 'attendance.read'],
}

export function RolesScreen() {
  const { data: roles = [], isLoading, error } = useRoles()
  const { data: permGroups = [] } = usePermissionGroups()
  const allPerms = useMemo(
    () => permGroups.flatMap((g) => g.perms),
    [permGroups],
  )
  const [selectedId, setSelectedId] = useState('r4')

  const [permState, setPermState] = useState<Record<string, Set<string>>>(() => {
    const out: Record<string, Set<string>> = {}
    Object.entries(DEFAULT_GRANTS).forEach(([k, v]) => {
      out[k] = new Set(v)
    })
    return out
  })

  const selected = roles.find((r) => r.id === selectedId)
  const stored = permState[selectedId]
  // admin (r1) implicitly holds every permission until explicitly edited
  const grants =
    selectedId === 'r1' && (stored?.size ?? 0) === 0
      ? new Set(allPerms)
      : (stored ?? new Set<string>())

  const toggle = (perm: string) => {
    setPermState((s) => {
      const next = new Set(s[selectedId] ?? [])
      if (next.has(perm)) next.delete(perm)
      else next.add(perm)
      return { ...s, [selectedId]: next }
    })
  }

  return (
    <div>
      <PageHeader
        title="Vai trò & quyền"
        description="Phân quyền theo module. /api/roles · /api/permissions"
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
                    'w-full text-left p-3 rounded-lg transition-colors',
                    selectedId === r.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{r.name}</div>
                    <Badge variant="muted">{r.accounts}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <code className="font-mono">{r.code}</code>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {r.description}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{selected?.name ?? '—'}</CardTitle>
                  <CardDesc>
                    <code className="font-mono">{selected?.code ?? ''}</code> ·{' '}
                    {selected?.accounts ?? 0} tài khoản đang dùng
                  </CardDesc>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="size-4" /> Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" /> Xóa
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium">Phân quyền theo module</div>
                <div className="text-xs text-muted-foreground">
                  {grants.size} / {allPerms.length} quyền
                </div>
              </div>
              <div className="space-y-4">
                {permGroups.map((g) => {
                  const granted = g.perms.filter((p) => grants.has(p)).length
                  const all = granted === g.perms.length && granted > 0
                  return (
                    <div key={g.module} className="border rounded-lg">
                      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-b">
                        <div>
                          <div className="font-medium text-sm">{g.label}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {g.module}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={all ? 'success' : granted > 0 ? 'warning' : 'muted'}
                          >
                            {granted}/{g.perms.length}
                          </Badge>
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={all}
                              onChange={() => {
                                setPermState((s) => {
                                  const next = new Set(s[selectedId] ?? [])
                                  if (all)
                                    g.perms.forEach((p) => next.delete(p))
                                  else g.perms.forEach((p) => next.add(p))
                                  return { ...s, [selectedId]: next }
                                })
                              }}
                            />
                            Chọn tất cả
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {g.perms.map((p) => {
                          const checked = grants.has(p)
                          return (
                            <label
                              key={p}
                              className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors',
                                checked ? 'bg-primary/5' : 'hover:bg-muted',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(p)}
                                className="rounded"
                              />
                              <code className="font-mono text-xs truncate">
                                {p}
                              </code>
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
              <Button
                onClick={() =>
                  toast.success('Đã lưu phân quyền', {
                    description: selected?.name ?? '',
                  })
                }
              >
                Lưu phân quyền
              </Button>
            </div>
          </Card>
        </div>
      </QueryState>
    </div>
  )
}

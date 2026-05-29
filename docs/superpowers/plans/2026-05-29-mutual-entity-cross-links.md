# Mutual Entity Cross-Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make entity links bidirectional — navigate and manage Account/Department/Role/Salary-rate relationships from both sides, with inline account edit/unlink on the employee detail page.

**Architecture:** Frontend-only, 4 screen files. Reuse existing TanStack Query hooks (`useUpdateAccount`, `useCreateEmployeeAccount`) and the existing `?employeeId=` / `?departmentId=` deep-link convention. No new routes, API, or types. Unlink = detach (`employeeId: null`), not delete.

**Tech Stack:** React 19, React Router (`react-router-dom`), TanStack Query, shadcn/ui, TypeScript (`verbatimModuleSyntax` — type-only imports must use `import type`).

---

## Testing note

This repo has **no test runner** (CLAUDE.md). Each task is verified by:
1. `pnpm build` — runs `tsc -b` (type-check) then `vite build`. Expected: completes with no errors.
2. `pnpm lint` — Expected: no new errors.
3. Manual browser check via `pnpm dev` — described per task.

Commit after each task passes all three.

---

## File Structure

- `src/screens/accounts.tsx` — read URL filters, role badge → role links, 1:1 employee dropdown filter.
- `src/screens/roles.tsx` — preselect role from `?roleId`, "accounts with this role" link.
- `src/screens/salary-rates.tsx` — back-link to employee detail.
- `src/screens/employee-detail.tsx` — dept links, inline account card, edit dialog, unlink.

---

### Task 1: Accounts screen — deep-link filters, role links, 1:1 dropdown

**Files:**
- Modify: `src/screens/accounts.tsx`

- [ ] **Step 1: Import `useSearchParams`**

Change line 2:

```tsx
import { Link } from 'react-router-dom'
```

to:

```tsx
import { Link, useSearchParams } from 'react-router-dom'
```

- [ ] **Step 2: Initialize `q` and `roleFilter` from the URL**

Replace these lines (currently ~80-82):

```tsx
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
```

with:

```tsx
  const [searchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') ?? 'all')
  const [statusFilter, setStatusFilter] = useState('all')
```

- [ ] **Step 3: Compute the 1:1 selectable-employee list**

Immediately after the `filtered` computation (currently ends ~93, before `startEdit`), add:

```tsx
  // 1:1 guard: hide employees already linked to a *different* account.
  const linkedEmployeeIds = new Set(
    list
      .filter((a) => a.employeeId && a.id !== editing.id)
      .map((a) => a.employeeId as string),
  )
  const selectableEmployees = employees.filter(
    (e) => !linkedEmployeeIds.has(e.id) || e.id === editing.employeeId,
  )
```

- [ ] **Step 4: Use `selectableEmployees` in the dropdown**

Replace the employee options (currently ~337-341):

```tsx
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.code} — {e.fullName}
                  </SelectItem>
                ))}
```

with:

```tsx
                {selectableEmployees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.code} — {e.fullName}
                  </SelectItem>
                ))}
```

- [ ] **Step 5: Make role badges link to the role**

Replace the role-badge block (currently ~239-253):

```tsx
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
```

with:

```tsx
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {a.roles.map((rc) => {
                          const r = roles.find((x) => x.code === rc)
                          const badge = (
                            <Badge
                              variant={rc === 'admin' ? 'default' : 'outline'}
                            >
                              {r?.name ?? rc}
                            </Badge>
                          )
                          return r ? (
                            <Link key={rc} to={`/system/roles?roleId=${r.id}`}>
                              {badge}
                            </Link>
                          ) : (
                            <span key={rc}>{badge}</span>
                          )
                        })}
                      </div>
                    </TableCell>
```

- [ ] **Step 6: Verify build + lint**

Run: `pnpm build`
Expected: completes, no type errors.

Run: `pnpm lint`
Expected: no new errors.

- [ ] **Step 7: Manual check**

Run `pnpm dev`. On `/system/accounts`: click a role badge → lands on `/system/roles?roleId=...`. Open "Thêm tài khoản" → the employee dropdown omits employees already linked to other accounts. Visit `/system/accounts?q=nv001` → search box pre-filled and list filtered.

- [ ] **Step 8: Commit**

```bash
git add src/screens/accounts.tsx
git commit -m "feat(accounts): deep-link filters, role links, 1:1 employee dropdown"
```

---

### Task 2: Roles screen — preselect from `?roleId`, accounts-with-role link

**Files:**
- Modify: `src/screens/roles.tsx`

- [ ] **Step 1: Add imports**

Change line 1-2 area. Replace:

```tsx
import { useMemo, useState } from 'react'
import { Edit, Plus } from 'lucide-react'
```

with:

```tsx
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Edit, Plus } from 'lucide-react'
```

Add `useAccounts` to the hook imports. Replace:

```tsx
import { useRoles, useUpdateRole } from '@/hooks/useRoles'
```

with:

```tsx
import { useRoles, useUpdateRole } from '@/hooks/useRoles'
import { useAccounts } from '@/hooks/useAccounts'
```

- [ ] **Step 2: Preselect role from the URL**

Replace (currently ~37):

```tsx
  const [selectedId, setSelectedId] = useState<string>('')
```

with:

```tsx
  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string>(
    searchParams.get('roleId') ?? '',
  )
```

- [ ] **Step 3: Load accounts + count in `PermissionEditor`**

In `PermissionEditor`, after `const updateRole = useUpdateRole()` (currently ~116), add:

```tsx
  const { data: accounts = [] } = useAccounts()
  const accountCount = accounts.filter((a) =>
    a.roles.includes(role.code),
  ).length
```

- [ ] **Step 4: Add the accounts link to the editor header**

Replace the header button group (currently ~165-169):

```tsx
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="size-4" /> Sửa
            </Button>
          </div>
```

with:

```tsx
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
```

- [ ] **Step 5: Verify build + lint**

Run: `pnpm build` — Expected: no type errors.
Run: `pnpm lint` — Expected: no new errors.

- [ ] **Step 6: Manual check**

`pnpm dev`. Visit `/system/roles?roleId=<an id>` → that role is preselected (not the first). The editor header shows "Tài khoản với vai trò này (N)"; clicking it lands on `/system/accounts?role=<code>` with the role filter applied.

- [ ] **Step 7: Commit**

```bash
git add src/screens/roles.tsx
git commit -m "feat(roles): preselect via ?roleId, link to accounts holding the role"
```

---

### Task 3: Salary-rates — back-link to employee detail

**Files:**
- Modify: `src/screens/salary-rates.tsx`

- [ ] **Step 1: Add imports**

Replace (currently line 2):

```tsx
import { useSearchParams } from 'react-router-dom'
```

with:

```tsx
import { Link, useSearchParams } from 'react-router-dom'
```

Replace (currently line 3):

```tsx
import { Edit, Plus, Trash2 } from 'lucide-react'
```

with:

```tsx
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react'
```

- [ ] **Step 2: Render the back-link when an employee is selected**

In the filter row inside the card, replace (currently ~229-245):

```tsx
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
```

with:

```tsx
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
          {employeeId && (
            <Button variant="ghost" size="sm" asChild className="mt-2 -ml-2">
              <Link to={`/employees/${employeeId}`}>
                <ArrowLeft className="size-4" /> Về hồ sơ nhân viên
              </Link>
            </Button>
          )}
        </div>
```

- [ ] **Step 3: Verify build + lint**

Run: `pnpm build` — Expected: no type errors.
Run: `pnpm lint` — Expected: no new errors.

- [ ] **Step 4: Manual check**

`pnpm dev`. From an employee detail page, click "Định mức" → `/salary-rates?employeeId=...`. A "Về hồ sơ nhân viên" link appears and returns to `/employees/<id>`.

- [ ] **Step 5: Commit**

```bash
git add src/screens/salary-rates.tsx
git commit -m "feat(salary-rates): back-link to employee detail"
```

---

### Task 4: Employee detail — department links

**Files:**
- Modify: `src/screens/employee-detail.tsx`

- [ ] **Step 1: Link the department in the profile header**

Replace (currently ~217-220):

```tsx
            <div className="text-sm text-muted-foreground mt-0.5">
              <code className="font-mono">{employee.code}</code> ·{' '}
              {employee.positionName || '—'} · {deptName(employee.departmentId)}
            </div>
```

with:

```tsx
            <div className="text-sm text-muted-foreground mt-0.5">
              <code className="font-mono">{employee.code}</code> ·{' '}
              {employee.positionName || '—'} ·{' '}
              <Link
                to={`/employees?departmentId=${employee.departmentId}`}
                className="hover:text-primary hover:underline"
              >
                {deptName(employee.departmentId)}
              </Link>
            </div>
```

- [ ] **Step 2: Allow `Row` to render a link value**

Replace the `Row` helper at the bottom of the file (currently ~600-607):

```tsx
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
```

with:

```tsx
function Row({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
```

Add the `React` import at the top of the file (after the existing react import on line 1):

```tsx
import { useMemo, useState } from 'react'
import type * as React from 'react'
```

- [ ] **Step 3: Link the "Phòng ban" Overview row**

Replace (currently ~271):

```tsx
                <Row label="Phòng ban" value={deptName(employee.departmentId)} />
```

with:

```tsx
                <Row
                  label="Phòng ban"
                  value={
                    <Link
                      to={`/employees?departmentId=${employee.departmentId}`}
                      className="hover:text-primary hover:underline"
                    >
                      {deptName(employee.departmentId)}
                    </Link>
                  }
                />
```

- [ ] **Step 4: Verify build + lint**

Run: `pnpm build` — Expected: no type errors.
Run: `pnpm lint` — Expected: no new errors.

- [ ] **Step 5: Manual check**

`pnpm dev`. On an employee detail page, the department name (header and Overview "Phòng ban" row) is a link → `/employees?departmentId=...` with that department pre-filtered.

- [ ] **Step 6: Commit**

```bash
git add src/screens/employee-detail.tsx
git commit -m "feat(employee-detail): link department to filtered employee list"
```

---

### Task 5: Employee detail — inline account card

Moves account display out of the header into an Overview "Tài khoản" card. Edit/unlink wiring is added in Tasks 6-7; this task only renders the card and re-wires create.

**Files:**
- Modify: `src/screens/employee-detail.tsx`

- [ ] **Step 1: Add the `Edit` and `Unlink` icons**

Replace the lucide import block (currently ~3-11):

```tsx
import {
  ArrowLeft,
  CalendarDays,
  Coins,
  ExternalLink,
  KeyRound,
  Plus,
  Wallet,
} from 'lucide-react'
```

with:

```tsx
import {
  ArrowLeft,
  CalendarDays,
  Coins,
  Edit,
  ExternalLink,
  KeyRound,
  Plus,
  Unlink,
  Wallet,
} from 'lucide-react'
```

- [ ] **Step 2: Remove the account badge/button from the header**

Replace (currently ~222-248):

```tsx
          <div className="flex items-center gap-2">
            {linkedAccount ? (
              <Badge variant="outline" className="gap-1.5">
                <KeyRound className="size-3.5" /> @{linkedAccount.username}
              </Badge>
            ) : (
              canManageAccounts && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAccountOpen(true)}
                >
                  <KeyRound className="size-4" /> Tạo tài khoản
                </Button>
              )
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to={`/salary-rates?employeeId=${employee.id}`}>
                <Coins className="size-4" /> Định mức
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/attendances?employeeId=${employee.id}`}>
                <CalendarDays className="size-4" /> Chấm công
              </Link>
            </Button>
          </div>
```

with:

```tsx
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/salary-rates?employeeId=${employee.id}`}>
                <Coins className="size-4" /> Định mức
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/attendances?employeeId=${employee.id}`}>
                <CalendarDays className="size-4" /> Chấm công
              </Link>
            </Button>
          </div>
```

- [ ] **Step 3: Wrap the Overview tab and add the account card**

Replace the entire Overview block (currently ~263-307):

```tsx
        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin</CardTitle>
              </CardHeader>
              <CardBody className="text-sm divide-y">
                <Row label="Mã nhân viên" value={employee.code} />
                <Row
                  label="Phòng ban"
                  value={
                    <Link
                      to={`/employees?departmentId=${employee.departmentId}`}
                      className="hover:text-primary hover:underline"
                    >
                      {deptName(employee.departmentId)}
                    </Link>
                  }
                />
                <Row label="Chức danh" value={employee.positionName || '—'} />
                <Row
                  label="Hình thức lương"
                  value={SALARY_LABELS[employee.salaryCalculationType]}
                />
                <Row label="Trạng thái" value={STATUS_LABELS[employee.status]} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Định mức đang áp dụng</CardTitle>
              </CardHeader>
              <CardBody className="text-sm">
                {activeRate ? (
                  <div className="divide-y">
                    <Row
                      label="Hình thức"
                      value={SALARY_LABELS[activeRate.calculationType]}
                    />
                    <Row label="Lương tháng" value={fmtVND(activeRate.monthlySalary)} />
                    <Row label="Đơn giá ngày" value={fmtVND(activeRate.dailyRate)} />
                    <Row label="Đơn giá giờ" value={fmtVND(activeRate.hourlyRate)} />
                    <Row
                      label="Hiệu lực từ"
                      value={fmtDate(activeRate.effectiveFrom)}
                    />
                  </div>
                ) : (
                  <div className="text-muted-foreground py-4">
                    Chưa có định mức lương.
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
```

with:

```tsx
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin</CardTitle>
                </CardHeader>
                <CardBody className="text-sm divide-y">
                  <Row label="Mã nhân viên" value={employee.code} />
                  <Row
                    label="Phòng ban"
                    value={
                      <Link
                        to={`/employees?departmentId=${employee.departmentId}`}
                        className="hover:text-primary hover:underline"
                      >
                        {deptName(employee.departmentId)}
                      </Link>
                    }
                  />
                  <Row label="Chức danh" value={employee.positionName || '—'} />
                  <Row
                    label="Hình thức lương"
                    value={SALARY_LABELS[employee.salaryCalculationType]}
                  />
                  <Row label="Trạng thái" value={STATUS_LABELS[employee.status]} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Định mức đang áp dụng</CardTitle>
                </CardHeader>
                <CardBody className="text-sm">
                  {activeRate ? (
                    <div className="divide-y">
                      <Row
                        label="Hình thức"
                        value={SALARY_LABELS[activeRate.calculationType]}
                      />
                      <Row label="Lương tháng" value={fmtVND(activeRate.monthlySalary)} />
                      <Row label="Đơn giá ngày" value={fmtVND(activeRate.dailyRate)} />
                      <Row label="Đơn giá giờ" value={fmtVND(activeRate.hourlyRate)} />
                      <Row
                        label="Hiệu lực từ"
                        value={fmtDate(activeRate.effectiveFrom)}
                      />
                    </div>
                  ) : (
                    <div className="text-muted-foreground py-4">
                      Chưa có định mức lương.
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Tài khoản</CardTitle>
                {linkedAccount && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/system/accounts?q=${linkedAccount.username}`}>
                      Accounts <ExternalLink className="size-3.5" />
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardBody>
                {linkedAccount ? (
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          @{linkedAccount.username}
                        </span>
                        <Badge
                          variant={
                            linkedAccount.status === 'Active'
                              ? 'success'
                              : 'destructive'
                          }
                        >
                          {linkedAccount.status === 'Active'
                            ? 'Hoạt động'
                            : 'Đã khóa'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {linkedAccount.roles.map((rc) => {
                          const r = roles.find((x) => x.code === rc)
                          return (
                            <Badge key={rc} variant="outline">
                              {r?.name ?? rc}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                    {canManageAccounts && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openEditAccount}
                        >
                          <Edit className="size-4" /> Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUnlinkOpen(true)}
                        >
                          <Unlink className="size-4" /> Gỡ liên kết
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Chưa có tài khoản đăng nhập.
                    </span>
                    {canManageAccounts && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAccountOpen(true)}
                      >
                        <KeyRound className="size-4" /> Tạo tài khoản
                      </Button>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
```

Note: this step references `openEditAccount` and `setUnlinkOpen`, which are added in Tasks 6-7. The build will fail until those exist — that is expected. Do **not** commit Task 5 alone; commit after Task 7. (Tasks 5-7 form one commit.)

- [ ] **Step 4: Continue to Task 6 (do not build/commit yet)**

---

### Task 6: Employee detail — edit account dialog

**Files:**
- Modify: `src/screens/employee-detail.tsx`

- [ ] **Step 1: Import `useUpdateAccount` and `AccountStatus`**

Replace (currently ~46):

```tsx
import { useAccounts } from '@/hooks/useAccounts'
```

with:

```tsx
import { useAccounts, useUpdateAccount } from '@/hooks/useAccounts'
```

Add the account type import near the other type imports (after line ~59):

```tsx
import type { SalaryCalculationType, EmployeeStatus } from '@/types/EmployeeType'
import type { AccountStatus } from '@/types/AccountType'
```

- [ ] **Step 2: Add edit-account state + handlers**

After the existing `createAccount` function (currently ends ~130), add:

```tsx
  const updateAccountMut = useUpdateAccount()
  const [editAcctOpen, setEditAcctOpen] = useState(false)
  const [editAcctRoleIds, setEditAcctRoleIds] = useState<string[]>([])
  const [editAcctPassword, setEditAcctPassword] = useState('')
  const [editAcctStatus, setEditAcctStatus] = useState<AccountStatus>('Active')
  const [unlinkOpen, setUnlinkOpen] = useState(false)

  const openEditAccount = () => {
    if (!linkedAccount) return
    setEditAcctRoleIds(
      linkedAccount.roles
        .map((code) => roles.find((r) => r.code === code)?.id)
        .filter((rid): rid is string => Boolean(rid)),
    )
    setEditAcctPassword('')
    setEditAcctStatus(linkedAccount.status)
    setEditAcctOpen(true)
  }

  const saveEditAccount = async () => {
    if (!linkedAccount) return
    try {
      await updateAccountMut.mutateAsync({
        id: linkedAccount.id,
        data: {
          roleIds: editAcctRoleIds,
          status: editAcctStatus,
          ...(editAcctPassword ? { newPassword: editAcctPassword } : {}),
        },
      })
      toast.success('Đã cập nhật tài khoản')
      setEditAcctOpen(false)
    } catch (e) {
      toast.error('Không thể cập nhật tài khoản', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }
```

- [ ] **Step 3: Add the edit dialog JSX**

Immediately before the closing `</div>` of the component's outer wrapper — that is, right after the existing create-account `<Dialog>...</Dialog>` block (currently ends ~595, before the final `</div>` at ~596) — insert:

```tsx
      <Dialog open={editAcctOpen} onOpenChange={setEditAcctOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa tài khoản</DialogTitle>
            <DialogDescription>
              {linkedAccount ? `@${linkedAccount.username}` : ''} — đổi vai trò,
              đặt lại mật khẩu hoặc khóa tài khoản.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Vai trò</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-none">
                {roles.map((r) => {
                  const checked = editAcctRoleIds.includes(r.id)
                  return (
                    <label
                      key={r.id}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1 rounded-none border cursor-pointer text-sm',
                        checked
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'hover:bg-muted',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setEditAcctRoleIds(
                            e.target.checked
                              ? [...editAcctRoleIds, r.id]
                              : editAcctRoleIds.filter((x) => x !== r.id),
                          )
                        }
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
                <Label>Đặt lại mật khẩu</Label>
                <Input
                  type="password"
                  value={editAcctPassword}
                  onChange={(e) => setEditAcctPassword(e.target.value)}
                  placeholder="Để trống nếu không đổi"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select
                  value={editAcctStatus}
                  onValueChange={(v) => setEditAcctStatus(v as AccountStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Đang hoạt động</SelectItem>
                    <SelectItem value="Locked">Đã khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAcctOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={saveEditAccount}
              disabled={updateAccountMut.isPending}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
```

- [ ] **Step 4: Continue to Task 7 (do not build/commit yet)**

---

### Task 7: Employee detail — unlink confirm + build/commit 5-7

**Files:**
- Modify: `src/screens/employee-detail.tsx`

- [ ] **Step 1: Import `ConfirmDialog`**

Add after the existing `Dialog` import block (after line ~36, the `DatePicker` import is around there — place it after the `@/components/ui/select` import, ~35):

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
```

- [ ] **Step 2: Add the unlink handler**

After `saveEditAccount` (added in Task 6), add:

```tsx
  const unlinkAccount = async () => {
    if (!linkedAccount) return
    try {
      await updateAccountMut.mutateAsync({
        id: linkedAccount.id,
        data: { employeeId: null },
      })
      toast.success('Đã gỡ liên kết tài khoản')
    } catch (e) {
      toast.error('Không thể gỡ liên kết', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }
```

- [ ] **Step 3: Add the ConfirmDialog JSX**

Right after the edit dialog `</Dialog>` (added in Task 6), insert:

```tsx
      <ConfirmDialog
        open={unlinkOpen}
        onOpenChange={setUnlinkOpen}
        title="Gỡ liên kết tài khoản?"
        description={`Tài khoản @${linkedAccount?.username ?? ''} sẽ tách khỏi nhân viên này. Tài khoản không bị xóa.`}
        danger
        confirmText="Gỡ liên kết"
        onConfirm={unlinkAccount}
      />
```

- [ ] **Step 4: Verify build + lint (Tasks 5-7 together)**

Run: `pnpm build`
Expected: completes, no type errors. (All references — `openEditAccount`, `setUnlinkOpen`, `saveEditAccount`, `unlinkAccount`, `AccountStatus` — now resolve.)

Run: `pnpm lint`
Expected: no new errors.

- [ ] **Step 5: Manual check**

`pnpm dev`. Open an employee with a linked account:
- Overview shows a "Tài khoản" card: `@username`, status badge, role badges, "Accounts" link → `/system/accounts?q=username`.
- "Sửa" opens the edit dialog; change roles / set a new password / toggle status → Lưu → toast, card refreshes.
- "Gỡ liên kết" → confirm dialog → confirm → toast, card flips to "Chưa có tài khoản đăng nhập." with the "Tạo tài khoản" button.
- For an employee with no account: card shows the create prompt; "Tạo tài khoản" still works.

- [ ] **Step 6: Commit (Tasks 5-7)**

```bash
git add src/screens/employee-detail.tsx
git commit -m "feat(employee-detail): inline account card with edit and unlink"
```

---

## Self-Review

**Spec coverage:**
- §1 Employee↔Account (link, card, edit, unlink) → Tasks 5, 6, 7. ✓
- §2 Department↔Employee → Task 4. ✓
- §3 Salary-rate↔Employee → Task 3. ✓
- §4 Role↔Account (badge links, ?roleId preselect, accounts-with-role link, accounts URL filters) → Tasks 1 (badge links + `?role`/`?q` init) + 2 (preselect + link). ✓
- §5 1:1 enforcement → Task 1 Step 3-4. ✓

**Type consistency:**
- `useUpdateAccount` payload uses `IUpdateAccount` fields `roleIds`, `newPassword`, `status`, `employeeId` — all present in `AccountType.ts`. ✓
- `AccountStatus` ('Active' | 'Locked') used in edit dialog Select + status badge. ✓
- `Row` value widened to `React.ReactNode`; all existing string callers remain valid. ✓
- Role link uses `r.id` (badge) and `role.code` (accounts filter), matching accounts.tsx `roleFilter` comparing against `a.roles` (codes) and roles screen keying by `id`. ✓

**Placeholder scan:** none — every step shows full code and exact commands.

**Cross-task note:** Tasks 5-7 all edit `employee-detail.tsx` and are interdependent; build/commit happens once after Task 7 (called out in Task 5 Step 3 and Task 7 Step 4-6).

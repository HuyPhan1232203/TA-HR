# Permission-Based Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each sidebar nav item only when the current session can actually access its route, using one shared access map that also drives the route guards.

**Architecture:** Introduce a `RouteAccess` type plus a `canAccess(session, access)` helper in `lib/permissions.ts`. Define a single `ROUTE_ACCESS` map (path → required perms/roles) in `nav.ts`, consumed by both the sidebar filter and the `ProtectedRoute` guards in `App.tsx`. The previously unguarded audit-logs route becomes admin-only.

**Tech Stack:** React 19 + TypeScript, react-router-dom, Vite. No test runner is configured, so verification is `pnpm build` (tsc + vite) + `pnpm lint` + manual browser checks.

**Verification note:** This repo has no unit-test runner (per CLAUDE.md). Standard TDD red/green is replaced by type-check + lint + manual browser verification at each task. Each task is ordered so the build stays green after every commit.

---

### Task 1: Access helpers in `permissions.ts`

Additive change — adds a type and two functions, touches nothing existing. Build stays green.

**Files:**
- Modify: `src/lib/permissions.ts`

- [ ] **Step 1: Add `RouteAccess`, `hasAnyRole`, `canAccess`**

Append to `src/lib/permissions.ts` (after the existing `hasAnyPermission`):

```ts
export interface RouteAccess {
  perms?: string[]
  roles?: string[]
}

export function hasAnyRole(
  session: IAuthSession | null,
  roles: string[],
): boolean {
  return roles.some((r) => session?.roles?.includes(r) ?? false)
}

export function canAccess(
  session: IAuthSession | null,
  access?: RouteAccess,
): boolean {
  if (!access) return true
  if (session?.roles?.includes('admin')) return true
  if (access.perms && hasAnyPermission(session, access.perms)) return true
  if (access.roles && hasAnyRole(session, access.roles)) return true
  return false
}
```

The existing `IAuthSession` import at the top of the file already covers the type used here — do not add a duplicate import.

- [ ] **Step 2: Type-check + lint**

Run: `pnpm build && pnpm lint`
Expected: both pass, no errors. (The new functions are unused so far — they are exported, so `noUnusedLocals` does not flag them.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/permissions.ts
git commit -m "feat(permissions): add RouteAccess type and canAccess/hasAnyRole helpers"
```

---

### Task 2: Shared `ROUTE_ACCESS` map in `nav.ts`

Additive — adds the map and imports the type. Leave `NavItem.perms` and the inline `/my-attendance` perms in place for now (removed in Task 5) so the sidebar keeps compiling. Build stays green.

**Files:**
- Modify: `src/components/layout/nav.ts`

- [ ] **Step 1: Import the `RouteAccess` type**

At the top of `src/components/layout/nav.ts`, below the existing lucide import block, add:

```ts
import type { RouteAccess } from '@/lib/permissions'
```

- [ ] **Step 2: Add the `ROUTE_ACCESS` map**

Add this export to `src/components/layout/nav.ts` (place it immediately after the `NAV_GROUPS` array definition, before `ScreenMeta`):

```ts
export const ROUTE_ACCESS: Record<string, RouteAccess> = {
  '/departments': { perms: ['hr.departments.manage', 'hr.departments.read'] },
  '/employees': { perms: ['hr.employees.manage', 'hr.employees.read'] },
  '/salary-rates': { perms: ['hr.employees.manage', 'hr.employees.read'] },
  '/attendances': { perms: ['attendance.read'] },
  '/shift-configs': { perms: ['attendance.read'] },
  '/holidays': { perms: ['attendance.read'] },
  '/my-attendance': {
    perms: [
      'attendance.self.check-in',
      'attendance.self.check-out',
      'attendance.self.request',
      'attendance.self.request.read',
    ],
  },
  '/salary-periods': { perms: ['payroll.periods.read'] },
  '/payroll-runs': { perms: ['payroll.read'] },
  '/overtime-approvals': { perms: ['attendance.read'] },
  '/reports': { perms: ['payroll.reports.read'] },
  '/system/accounts': { perms: ['accounts.manage', 'accounts.read'] },
  '/system/roles': { perms: ['roles.manage', 'roles.read'] },
  '/system/audit-logs': { roles: ['admin'] },
}
```

- [ ] **Step 2b: Verify the table matches the route guards**

Cross-check every entry above against the `perms={[...]}` props currently in `src/App.tsx`. They must be identical strings (this is the whole point — one source of truth). `/dashboard`, the index route, `/employees/:id`, and `/login`/`/403` deliberately have no entry. `/employees/:id` will reuse `ROUTE_ACCESS['/employees']` in Task 4.

- [ ] **Step 3: Type-check + lint**

Run: `pnpm build && pnpm lint`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/nav.ts
git commit -m "feat(nav): add shared ROUTE_ACCESS map"
```

---

### Task 3: Sidebar filters via `canAccess`

Switch the sidebar from the per-item `perms` field to the shared map. `NavItem.perms` still exists (used nowhere after this) and is removed in Task 5. Build stays green.

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Update imports**

In `src/components/layout/sidebar.tsx`, change the two relevant import lines:

Replace:

```ts
import { hasAnyPermission } from '../../lib/permissions'
import { NAV_GROUPS } from './nav'
```

With:

```ts
import { canAccess } from '../../lib/permissions'
import { NAV_GROUPS, ROUTE_ACCESS } from './nav'
```

- [ ] **Step 2: Update the filter**

Replace the `groups` computation (currently `sidebar.tsx:14-19`):

```ts
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (item) => !item.perms || hasAnyPermission(session, item.perms),
    ),
  })).filter((g) => g.items.length > 0)
```

With:

```ts
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => canAccess(session, ROUTE_ACCESS[item.to])),
  })).filter((g) => g.items.length > 0)
```

Items with no `ROUTE_ACCESS` entry (e.g. `/dashboard`) → `canAccess(session, undefined)` → `true`, so they stay visible to any authenticated user. Empty groups are still dropped by the existing `.filter`.

- [ ] **Step 3: Type-check + lint**

Run: `pnpm build && pnpm lint`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(sidebar): filter nav items via shared ROUTE_ACCESS"
```

---

### Task 4: Route guards use `access` prop

`ProtectedRoute`'s prop rename and all `App.tsx` call sites must change together, or the build breaks. Do both in one commit. Also adds the missing guard on `/system/audit-logs`.

**Files:**
- Modify: `src/components/protected-route.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Rewrite `protected-route.tsx`**

Replace the full contents of `src/components/protected-route.tsx` with:

```tsx
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './auth-context'
import { canAccess, type RouteAccess } from '../lib/permissions'
import { Empty } from './ui/empty'
import { ShieldAlert } from 'lucide-react'

export interface ProtectedRouteProps {
  children: ReactNode
  access?: RouteAccess
}

export function ProtectedRoute({ children, access }: ProtectedRouteProps) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (access && !canAccess(session, access)) {
    const needed = access.perms ?? access.roles ?? []
    return (
      <Empty
        icon={ShieldAlert}
        title="Không có quyền truy cập"
        desc={`Cần một trong các quyền: ${needed.join(', ')}`}
      />
    )
  }

  return <>{children}</>
}
```

- [ ] **Step 2: Update `App.tsx` imports**

In `src/App.tsx`, add `ROUTE_ACCESS` to the nav import. There is currently no nav import in `App.tsx`, so add this line alongside the other `@/components/...` imports (e.g. after the `ProtectedRoute` import on line 7):

```ts
import { ROUTE_ACCESS } from '@/components/layout/nav'
```

- [ ] **Step 3: Swap every `perms={[...]}` for `access={ROUTE_ACCESS['<path>']}`**

In `src/App.tsx`, replace each guarded route's `ProtectedRoute` opening tag. The top-level `<ProtectedRoute>` wrapping `<AppShell />` (around line 38) has no perms — leave it exactly as is (auth-only gate). Apply these replacements:

```tsx
<ProtectedRoute perms={['hr.departments.manage', 'hr.departments.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/departments']}>
```

```tsx
// the /employees route
<ProtectedRoute perms={['hr.employees.manage', 'hr.employees.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/employees']}>
```

```tsx
// the /employees/:id route
<ProtectedRoute perms={['hr.employees.manage', 'hr.employees.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/employees']}>
```

```tsx
// the /attendances route
<ProtectedRoute perms={['attendance.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/attendances']}>
```

```tsx
// the /shift-configs route
<ProtectedRoute perms={['attendance.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/shift-configs']}>
```

```tsx
// the /holidays route
<ProtectedRoute perms={['attendance.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/holidays']}>
```

For the `/my-attendance` route, replace the multi-line block:

```tsx
                  <ProtectedRoute
                    perms={[
                      'attendance.self.check-in',
                      'attendance.self.check-out',
                      'attendance.self.request',
                      'attendance.self.request.read',
                    ]}
                  >
```
→
```tsx
                  <ProtectedRoute access={ROUTE_ACCESS['/my-attendance']}>
```

```tsx
// the /salary-rates route
<ProtectedRoute perms={['hr.employees.manage', 'hr.employees.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/salary-rates']}>
```

```tsx
<ProtectedRoute perms={['payroll.periods.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/salary-periods']}>
```

```tsx
<ProtectedRoute perms={['payroll.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/payroll-runs']}>
```

```tsx
// the /overtime-approvals route
<ProtectedRoute perms={['attendance.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/overtime-approvals']}>
```

```tsx
<ProtectedRoute perms={['payroll.reports.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/reports']}>
```

```tsx
<ProtectedRoute perms={['accounts.manage', 'accounts.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/system/accounts']}>
```

```tsx
<ProtectedRoute perms={['roles.manage', 'roles.read']}>
```
→
```tsx
<ProtectedRoute access={ROUTE_ACCESS['/system/roles']}>
```

Note: `/attendances`, `/shift-configs`, `/holidays`, `/overtime-approvals` all share the literal `perms={['attendance.read']}`. Replace each by its route's own `ROUTE_ACCESS[...]` key as shown — do not use `replace_all`, which would collapse them incorrectly.

- [ ] **Step 4: Guard the audit-logs route**

In `src/App.tsx`, the `/system/audit-logs` route is currently unguarded:

```tsx
<Route path="/system/audit-logs" element={<AuditLogsScreen />} />
```

Replace it with:

```tsx
<Route
  path="/system/audit-logs"
  element={
    <ProtectedRoute access={ROUTE_ACCESS['/system/audit-logs']}>
      <AuditLogsScreen />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 5: Type-check + lint**

Run: `pnpm build && pnpm lint`
Expected: both pass. (If tsc reports a remaining `perms` prop, a route was missed — grep `perms=` in `src/App.tsx` to find it.)

Run: `grep -n "perms=" src/App.tsx`
Expected: no output (all swapped to `access=`).

- [ ] **Step 6: Commit**

```bash
git add src/components/protected-route.tsx src/App.tsx
git commit -m "feat(routes): guard routes via shared ROUTE_ACCESS, gate audit-logs to admin"
```

---

### Task 5: Remove the dead `NavItem.perms` field

`NavItem.perms` and the inline `/my-attendance` perms are no longer read by anyone (sidebar now uses `ROUTE_ACCESS`). Remove them so the centralized map is the only definition.

**Files:**
- Modify: `src/components/layout/nav.ts`

- [ ] **Step 1: Drop the `perms` field from `NavItem`**

In `src/components/layout/nav.ts`, remove the `perms` field and its comment from the `NavItem` interface:

Remove these lines:

```ts
  // When set, the item only shows if the user has any of these permissions.
  // Items without `perms` are always visible.
  perms?: string[]
```

The interface becomes:

```ts
export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}
```

- [ ] **Step 2: Remove the inline `perms` from the `/my-attendance` nav item**

In the `NAV_GROUPS` array, the `/my-attendance` item currently carries an inline `perms` array. Replace that item:

```ts
      {
        to: '/my-attendance',
        label: 'Chấm công của tôi',
        icon: UserCheck,
        perms: [
          'attendance.self.check-in',
          'attendance.self.check-out',
          'attendance.self.request',
          'attendance.self.request.read',
        ],
      },
```
→
```ts
      { to: '/my-attendance', label: 'Chấm công của tôi', icon: UserCheck },
```

(Its access requirement now lives only in `ROUTE_ACCESS['/my-attendance']`.)

- [ ] **Step 3: Type-check + lint**

Run: `pnpm build && pnpm lint`
Expected: both pass.

Run: `grep -rn "\.perms\|perms:" src/components/layout/nav.ts src/components/layout/sidebar.tsx`
Expected: no output (no leftover `perms` field/usage in nav or sidebar).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/nav.ts
git commit -m "refactor(nav): drop NavItem.perms, ROUTE_ACCESS is sole source"
```

---

### Task 6: Manual verification in the browser

No automated UI tests exist. Verify behavior against the real app.

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`
Expected: Vite serves on the printed local URL (e.g. `http://localhost:5173`).

- [ ] **Step 2: Self-service user — menu**

Log in as a user whose `my-permission` returns only `attendance.self.*` (the reported case).
Expected sidebar: **only** the "Tổng quan" group (Bảng điều khiển / Dashboard) and, under "Nhân sự", **only** "Chấm công của tôi". No Phòng ban, Nhân viên, payroll, or Hệ thống items.

- [ ] **Step 3: Self-service user — direct navigation is denied**

Manually enter `/system/accounts` in the address bar.
Expected: "Không có quyền truy cập" screen (route guard denies; menu omits the item).

- [ ] **Step 4: Non-admin — audit-logs is now guarded**

As the self-service (non-admin) user, navigate to `/system/audit-logs`.
Expected: "Không có quyền truy cập" (previously this route was open to anyone).

- [ ] **Step 5: Admin user — full menu**

Log in as a user whose `roles` include `admin`.
Expected: every group and item visible, including Hệ thống → Nhật ký hoạt động (audit-logs), and all routes reachable.

- [ ] **Step 6: Final build + lint gate**

Run: `pnpm build && pnpm lint`
Expected: both pass.

If any check fails, fix the offending task's code and re-run from Step 1. No commit in this task unless a fix is required (commit the fix with a `fix:` message).

---

## Self-Review

**Spec coverage:**
- Sidebar filters by access (spec §Components 3) → Task 3. ✓
- `RouteAccess` + `canAccess` + `hasAnyRole` (spec §Components 1) → Task 1. ✓
- Shared `ROUTE_ACCESS` map, all paths (spec §Components 2, §Canonical access table) → Task 2 + Task 5 (cleanup). ✓
- `ProtectedRoute` `perms`→`access` (spec §Components 4) → Task 4. ✓
- `App.tsx` routes use `ROUTE_ACCESS`, `/employees/:id` reuses `/employees` (spec §Components 5) → Task 4. ✓
- audit-logs admin-only / close unguarded hole (spec §Decisions, §Components 5) → Task 4 Step 4. ✓
- Dashboard stays open to all authed (spec §Decisions) → Tasks 2/3 (no entry → `canAccess` true). ✓
- Testing: manual + build/lint (spec §Testing) → Task 6. ✓
- Out of scope items (dashboard restriction, backend, button-level gating) → not implemented. ✓

**Placeholder scan:** No TBD/TODO. Every code step shows full code; every command shows expected output. ✓

**Type consistency:** `RouteAccess { perms?: string[]; roles?: string[] }` defined in Task 1; used identically in Task 2 (`ROUTE_ACCESS: Record<string, RouteAccess>`), Task 4 (`access?: RouteAccess`, `access.perms ?? access.roles`), Task 3/4 (`canAccess(session, ...)`). `canAccess` signature `(session, access?)` consistent across Tasks 1/3/4. ✓

# Permission-Based Menu — Design

**Date:** 2026-05-29
**Status:** Approved (pending spec review)

## Problem

The sidebar already filters nav items by permission (`sidebar.tsx` keeps an item
only when `!item.perms || hasAnyPermission(session, item.perms)`), and routes are
guarded by `ProtectedRoute`. But in `nav.ts` only `/my-attendance` declares a
`perms` array. Every other nav item has no `perms`, so the filter treats it as
"always visible".

Result: a self-service user (whose `my-permission` response contains only
`attendance.self.*` permissions) sees the full admin menu. Clicking any guarded
item lands on the "Không có quyền truy cập" screen because the route guard
correctly denies access. The menu and the guards disagree.

Sample `my-permission` payload for an affected user:

```json
{
  "permissions": [
    "attendance.self.attendance.read",
    "attendance.self.check-in",
    "attendance.self.check-out",
    "attendance.self.overtime.read",
    "attendance.self.overtime.request",
    "attendance.self.request",
    "attendance.self.request.read"
  ]
}
```

Secondary issue: the `/system/audit-logs` route has **no** `ProtectedRoute`
guard at all — any authenticated user can reach it.

## Goal

The sidebar shows a nav item only when the current session can actually access
its route. Menu visibility and route guards must share one source of truth so
they cannot drift apart.

## Decisions

- **Single source of truth:** a shared `ROUTE_ACCESS` map keyed by path,
  consumed by both `App.tsx` route guards and `nav.ts`/sidebar.
- **Audit-logs gating:** admin only (closes the current unguarded hole).
- **Dashboard:** stays visible to every authenticated user (no access entry).
  Out of scope to restrict in this change.

## Canonical access table

Permission strings are taken from the existing `App.tsx` route guards (the only
place they currently live).

| Path | Access |
|---|---|
| `/dashboard` | none (any authenticated user) |
| `/departments` | perms: `hr.departments.manage`, `hr.departments.read` |
| `/employees` | perms: `hr.employees.manage`, `hr.employees.read` |
| `/employees/:id` | reuses `/employees` |
| `/salary-rates` | perms: `hr.employees.manage`, `hr.employees.read` |
| `/attendances` | perms: `attendance.read` |
| `/shift-configs` | perms: `attendance.read` |
| `/holidays` | perms: `attendance.read` |
| `/my-attendance` | perms: `attendance.self.check-in`, `attendance.self.check-out`, `attendance.self.request`, `attendance.self.request.read` |
| `/salary-periods` | perms: `payroll.periods.read` |
| `/payroll-runs` | perms: `payroll.read` |
| `/overtime-approvals` | perms: `attendance.read` |
| `/reports` | perms: `payroll.reports.read` |
| `/system/accounts` | perms: `accounts.manage`, `accounts.read` |
| `/system/roles` | perms: `roles.manage`, `roles.read` |
| `/system/audit-logs` | roles: `admin` |

## Components

### 1. `src/lib/permissions.ts`

Add a `RouteAccess` type and two functions. Keep existing `hasPermission` /
`hasAnyPermission` unchanged.

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
  if (!access) return true                              // no restriction
  if (session?.roles?.includes('admin')) return true    // admin shortcut
  if (access.perms && hasAnyPermission(session, access.perms)) return true
  if (access.roles && hasAnyRole(session, access.roles)) return true
  return false                                          // restricted, no match
}
```

Behavior check for admin-only (`{ roles: ['admin'] }`): a non-admin has no
matching role and no `perms`, so `canAccess` returns `false`; an admin passes via
the shortcut.

### 2. `src/components/layout/nav.ts`

Define the shared map. `RouteAccess` imported from `permissions.ts`.

```ts
import type { RouteAccess } from '@/lib/permissions'

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

Remove the `perms?: string[]` field from `NavItem` and the inline `perms` on the
`/my-attendance` item (now centralized in `ROUTE_ACCESS`). Nav item visibility is
derived from `ROUTE_ACCESS[item.to]`.

### 3. `src/components/layout/sidebar.tsx`

Replace the existing filter with the shared check:

```ts
items: g.items.filter((item) => canAccess(session, ROUTE_ACCESS[item.to]))
```

Items with no `ROUTE_ACCESS` entry (e.g. `/dashboard`) remain visible to any
authenticated user. Groups that end up empty are still dropped by the existing
`.filter((g) => g.items.length > 0)`.

### 4. `src/components/protected-route.tsx`

Change the prop from `perms?: string[]` to `access?: RouteAccess` and deny via
`canAccess`:

```ts
export interface ProtectedRouteProps {
  children: ReactNode
  access?: RouteAccess
}

// inside component:
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
```

### 5. `src/App.tsx`

Each guarded route swaps `perms={[...]}` for `access={ROUTE_ACCESS['<path>']}`.
The `/employees/:id` route reuses `ROUTE_ACCESS['/employees']`. The
`/system/audit-logs` route gains a guard:

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

## Data flow

Login → `my-permission` → `session.permissions` + `session.roles` (unchanged).
Both the sidebar and every route guard read the same `ROUTE_ACCESS` map through
`canAccess`. There is one definition of who may reach each route, so menu and
guards cannot disagree.

## Error handling

- Unauthenticated → existing `ProtectedRoute` redirect to `/login` (unchanged).
- Authenticated but lacking access → `Empty` "Không có quyền truy cập" screen
  listing the required perms or roles.
- Menu simply omits items the user cannot access.

## Testing

No test runner is configured in this repo. Verification is manual + build:

1. Log in as a self-service user (perms = `attendance.self.*` only). Expect the
   sidebar to show **only** Dashboard + "Chấm công của tôi". Confirm no admin
   groups appear.
2. Log in as an admin. Expect all groups/items, including audit-logs.
3. Directly navigate to a restricted path (e.g. `/system/accounts`) as the
   self-service user → "Không có quyền truy cập" screen.
4. Navigate to `/system/audit-logs` as a non-admin → denied (was previously open).
5. `pnpm build` (tsc + vite) and `pnpm lint` pass.

## Out of scope

- Restricting the Dashboard by permission.
- Backend permission changes.
- Per-action (button-level) permission gating inside screens.

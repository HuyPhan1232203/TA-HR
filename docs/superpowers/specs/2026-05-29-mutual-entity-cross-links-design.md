# Mutual Entity Cross-Links — Design

**Date:** 2026-05-29
**Status:** Approved

## Problem

Entity relationships in the app link in only one direction. From an Account you can
jump to its Employee, but from an Employee you only see a static `@username` badge —
no link, no edit, no unlink. Several other entity pairs have the same one-sided gap.
Make the links **mutual** so navigation and management work from both sides.

## Verified current state

| Pair | Forward | Reverse | Gap to close |
|------|---------|---------|--------------|
| Employee ↔ Account | account→employee link (`accounts.tsx:222`) + employee dropdown | employee→account = static badge, not a link (`employee-detail.tsx:224`) | reverse link + edit + unlink |
| Department ↔ Employee | dept→employees (`departments.tsx:174`, `/employees?departmentId=`) | employee dept name = plain text (`employee-detail.tsx:219`) | employee→dept link |
| Role ↔ Account | — | account role badges not links (`accounts.tsx:244`); roles screen has no accounts list | both directions |
| Salary-rate ↔ Employee | employee→rates (`employee-detail.tsx:239`, `/salary-rates?employeeId=`) | no back-link to employee | reverse link |

Notes:
- No account detail route exists; account/role/department screens are list-only.
- `useUpdateAccount` supports unlink via `employeeId: null`, role change via `roleIds`,
  password reset via `newPassword`, and `status`. No delete endpoint (unlink = detach).
- `useCreateEmployeeAccount` already powers the in-detail create dialog.
- Employee-detail already hides "Tạo tài khoản" when an account is linked (guards one side
  of 1:1). The account dropdown (`accounts.tsx:337`) lists ALL employees — no exclusion.
- No new API, no new routes, no type changes anywhere in this design.

## Design

### 1. Employee ↔ Account (core)

**`employee-detail.tsx`** — replace the static badge (line 224) with an **account card**
in the Overview tab.

- **Linked state:** show `@username`, status badge, role badges. Buttons:
  - **Sửa** → opens edit dialog.
  - **Gỡ liên kết** → `ConfirmDialog`, then `useUpdateAccount` with `employeeId: null`.
    The account is detached, not deleted.
  - **↗ Accounts** → link to `/system/accounts?q={username}`.
- **Not-linked state:** keep the existing "Tạo tài khoản" button + create dialog unchanged.
- **Edit dialog:** reuse `useUpdateAccount`. Fields:
  - Roles — checkbox list, same UI as the existing create dialog (lines 552–584).
  - Reset password — optional `newPassword` (blank = unchanged).
  - Status — Active / Locked.
  - Save → `mutateAsync({ id, data: { roleIds, newPassword?, status } })`.
- The linked account is found via `accounts.find(a => a.employeeId === id)` (already
  computed at `employee-detail.tsx:99`).

### 2. Department ↔ Employee

**`employee-detail.tsx`** — the department name (header line 219 and the Overview
"Phòng ban" row) becomes a link to `/employees?departmentId={departmentId}`.
Reverse direction (department → employees) already works.

### 3. Salary-rate ↔ Employee

**`salary-rates.tsx`** — when `employeeId` is set, show a back-link/breadcrumb to
`/employees/{employeeId}`. Forward direction already works.

### 4. Role ↔ Account

- **`accounts.tsx`** — role badges (line 244) become links to `/system/roles?roleId={id}`.
- **`roles.tsx`** — read `?roleId` from the URL to preselect a role
  (currently `useState('')` defaulting to the first role). In the `PermissionEditor`
  header, add a **"Tài khoản với vai trò này"** entry (count + link) to
  `/system/accounts?role={code}`.
- **`accounts.tsx`** — initialize `q` and `roleFilter` from `useSearchParams`
  (currently state-only), so deep-links from roles land already filtered.

### 5. 1:1 enforcement

**`accounts.tsx`** — the employee dropdown (line 337) excludes employees already linked
to a *different* account; the currently-edited account's employee stays selectable.
Frontend guard only (backend may also enforce); this prevents the common mistake of
linking two accounts to one employee. The employee-detail side already guards by hiding
the create button when linked.

## Data flow & error handling

- All writes go through existing hooks: `useUpdateAccount`, `useCreateEmployeeAccount`.
  Their `onSuccess` already calls `invalidateQueries(['accounts'])`, so the inline card
  and lists refresh automatically.
- Errors surface via `toast.error(message)` — the established pattern across screens.
- Unlink is gated by `ConfirmDialog`.
- Deep-link params reuse the existing `?employeeId=` / `?departmentId=` convention.

## Out of scope

- No account detail route (`/system/accounts/:id`) — list-only pattern preserved.
- No new API endpoints, hooks signatures, or type changes.
- No backend 1:1 constraint work — frontend guard only.

## Files touched

- `src/screens/employee-detail.tsx`
- `src/screens/accounts.tsx`
- `src/screens/roles.tsx`
- `src/screens/salary-rates.tsx`

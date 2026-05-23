# shadcn/ui Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled Tailwind primitives in `src/components/ui/*` with official shadcn/ui (Radix) components installed via the CLI, and rewrite every screen to use idiomatic shadcn APIs (Dialog, Sheet, Select, Tabs, AlertDialog, DatePicker) — while preserving the indigo-blue oklch brand.

**Architecture:** Pre-create `components.json` so the shadcn CLI runs non-interactively; reconcile `src/index.css` (additive — the existing Tailwind v4 `@theme` already exposes brand tokens). `shadcn add` overwrites the presentational primitives and adds Radix-backed ones. Two composed local files (`date-picker`, `confirm-dialog`) and a `data-table` refactor sit on top. Screens are rewritten group-by-group to idiomatic APIs.

**Tech Stack:** React 19, TypeScript (verbatimModuleSyntax + erasableSyntaxOnly — type-only imports MUST use `import type`), Vite 8, Tailwind v4, shadcn/ui (new-york style), Radix UI, react-day-picker + date-fns, tw-animate-css, sonner.

**Baseline branch:** work starts from `align/real-api` (current HEAD). Execution creates branch `feat/shadcn-ui`.

**No test runner** (per CLAUDE.md). Every task verifies with `pnpm build` (tsc -b + vite build) and `pnpm lint`. A manual dev smoke is the final task. Run `pnpm build`, NOT `pnpm exec tsc` (the latter resolves a wrong global TypeScript here).

---

## Idiomatic shadcn snippets (reference — used throughout screen tasks)

These are the canonical patterns the screen rewrites use. Reuse verbatim, adapting values.

**Dialog (controlled, opened from a handler):**
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Desc</DialogDescription>
    </DialogHeader>
    {/* body */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
      <Button onClick={save}>Lưu</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Sheet (right drawer):**
```tsx
<Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
  <SheetContent side="right" className="w-[560px] sm:max-w-[560px] flex flex-col">
    <SheetHeader>
      <SheetTitle>{title}</SheetTitle>
      <SheetDescription>{desc}</SheetDescription>
    </SheetHeader>
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4">{/* body */}</div>
    <SheetFooter>{/* buttons */}</SheetFooter>
  </SheetContent>
</Sheet>
```

**Select (sentinel `"all"` for no-filter — shadcn Select forbids empty-string values):**
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Chọn…" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Tất cả</SelectItem>
    {items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
  </SelectContent>
</Select>
```

**Tabs:**
```tsx
<Tabs value={tab} onValueChange={(v) => setTab(v as MyTab)}>
  <TabsList>
    <TabsTrigger value="all">Tất cả</TabsTrigger>
    <TabsTrigger value="confirmed">Đã xác nhận</TabsTrigger>
  </TabsList>
</Tabs>
```

**DatePicker (local component from Task 3):**
```tsx
<DatePicker value={form.fromDate} onChange={(v) => setForm({ ...form, fromDate: v })} />
```

**ConfirmDialog (local component from Task 3):**
```tsx
const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
// ...trigger:
setConfirmState({ title: 'Xóa?', description: '…', danger: true, confirmText: 'Xóa', onConfirm: () => doDelete(id) })
// ...render once near root of screen:
<ConfirmDialog
  open={!!confirmState}
  onOpenChange={(o) => { if (!o) setConfirmState(null) }}
  title={confirmState?.title ?? ''}
  description={confirmState?.description}
  danger={confirmState?.danger}
  confirmText={confirmState?.confirmText}
  onConfirm={() => { confirmState?.onConfirm(); setConfirmState(null) }}
/>
```

**shadcn Table parts (replaces custom Table/THead/TH/TR/TD):**
```tsx
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table'
<Table>
  <TableHeader><TableRow><TableHead>Col</TableHead></TableRow></TableHeader>
  <TableBody>{rows.map(r => <TableRow key={r.id}><TableCell>…</TableCell></TableRow>)}</TableBody>
</Table>
```

---

## File Structure

**Create:**
- `components.json` — shadcn config (root)
- `src/components/ui/date-picker.tsx` — Popover + Calendar, emits `YYYY-MM-DD`
- `src/components/ui/confirm-dialog.tsx` — AlertDialog-based controlled confirm

**Replaced by `shadcn add` (overwrite existing where present):**
- `button.tsx card.tsx input.tsx label.tsx textarea.tsx badge.tsx tabs.tsx table.tsx`
- New: `dialog.tsx sheet.tsx select.tsx popover.tsx calendar.tsx alert-dialog.tsx dropdown-menu.tsx tooltip.tsx`

**Modify:** `src/index.css` (reconcile), `src/components/ui/data-table.tsx` (refactor onto shadcn Table), all 13 screens, `src/components/layout/*` (Button/Input usages stay API-compatible; verify), `src/App.tsx` (optional TooltipProvider).

**Delete:** `src/components/ui/modal.tsx`, `src/components/ui/drawer.tsx`, `src/components/ui/confirm.tsx`.

**Keep untouched:** `src/components/ui/avatar.tsx` (custom initials avatar), `src/components/ui/empty.tsx`, `src/components/ui/query-state.tsx`, `src/components/ui/toast` via sonner.

---

## Task 1: shadcn init — config, deps, theme reconcile

**Files:**
- Create: `components.json`
- Modify: `src/index.css`
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install runtime deps the components need**

Run:
```bash
pnpm add react-day-picker date-fns && pnpm add -D tw-animate-css
```
(Radix packages are pulled per-component by `shadcn add` in Task 2.)

- [ ] **Step 2: Create `components.json`** (lets the CLI run non-interactively)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3: Reconcile `src/index.css`** — additive changes so Radix components animate + theme correctly while keeping the brand.

Replace the first line `@import 'tailwindcss';` with these three lines:
```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));
```

Then, inside the existing `@theme { … }` block, add these derived radius + chart tokens immediately after the `--radius: 0.625rem;` line (keep everything else in `@theme` unchanged):
```css
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --color-chart-1: oklch(0.5635 0.2408 260.8178);
  --color-chart-2: oklch(0.62 0.19 260);
  --color-chart-3: oklch(0.7 0.16 260);
  --color-chart-4: oklch(0.78 0.12 260);
  --color-chart-5: oklch(0.85 0.08 260);
```

(No `:root`/`.dark` rewrite is needed — the existing `@theme` `--color-*` tokens already back the `bg-background`/`bg-primary`/`border-border` utilities the shadcn components use.)

- [ ] **Step 4: Smoke-test the CLI can add one component non-interactively**

Run:
```bash
npx shadcn@latest add button --yes --overwrite
```
Expected: it rewrites `src/components/ui/button.tsx` (new-york style) and prints success. If it errors that the framework/config can't be detected, STOP and report BLOCKED with the exact message (do not hand-roll components — the user chose the CLI).

- [ ] **Step 5: Verify build still compiles with the new button**

Run: `pnpm build`
Expected: tsc + vite build succeed (the new shadcn Button is API-compatible: `variant`/`size`/`className` + `asChild`). If screens break because the new Button dropped a variant they use, note it — our variants (`default/outline/ghost/secondary/destructive/link`, sizes `sm/md/lg/icon/iconsm`) mostly match; the shadcn default sizes are `default/sm/lg/icon`. If `size="md"`/`"iconsm"` are now invalid, that is handled in Task 7 (screens) — for THIS task it's acceptable if build flags those; if so, proceed anyway and fix in Task 2 hardening.

- [ ] **Step 6: Commit**

```bash
git add components.json src/index.css package.json pnpm-lock.yaml src/components/ui/button.tsx
git commit -m "chore: shadcn init — components.json, theme reconcile, button"
```

---

## Task 2: Add all shadcn components + normalize Button sizes

**Files:**
- Create/replace: the shadcn component files in `src/components/ui/`
- Modify: any file referencing `size="md"`/`size="iconsm"` (Button) — normalize to shadcn sizes

- [ ] **Step 1: Add the component set**

Run:
```bash
npx shadcn@latest add card input label textarea badge tabs table dialog sheet select popover calendar alert-dialog dropdown-menu tooltip --yes --overwrite
```
Expected: each file written under `src/components/ui/`, Radix deps installed. Confirm files exist: `dialog.tsx sheet.tsx select.tsx popover.tsx calendar.tsx alert-dialog.tsx dropdown-menu.tsx tooltip.tsx tabs.tsx table.tsx card.tsx input.tsx label.tsx textarea.tsx badge.tsx`.

- [ ] **Step 2: Decide Button size strategy**

shadcn Button sizes are `default | sm | lg | icon`. Our code uses `size="md"` (default), `size="icon"`, `size="iconsm"` (small icon button), `size="sm"`, `size="lg"`. To avoid touching dozens of call sites, EXTEND the generated `button.tsx` cva `size` variants. Open `src/components/ui/button.tsx` and in the `size` variants object add `md` and `iconsm` so all existing call sites stay valid:
```tsx
        // inside size: { … }
        md: "h-9 px-4 py-2 has-[>svg]:px-3",
        iconsm: "size-8",
```
(Keep the generated `default`, `sm`, `lg`, `icon`. Leave the rest of the file as generated.)

- [ ] **Step 3: Re-add Badge custom variants**

The screens use Badge variants `success`, `warning`, `muted`, `secondary`, `outline`, `default`, `destructive`. The generated shadcn `badge.tsx` only has `default/secondary/destructive/outline`. Edit `src/components/ui/badge.tsx` cva `variant` map to add:
```tsx
        success:
          "border-transparent bg-[oklch(0.95_0.05_145)] text-[oklch(0.42_0.13_145)]",
        warning:
          "border-transparent bg-[oklch(0.96_0.07_80)] text-[oklch(0.45_0.13_70)]",
        muted: "border-transparent bg-muted text-muted-foreground",
```
Keep the generated variants.

- [ ] **Step 4: Verify the UI lib builds in isolation**

Run: `pnpm exec eslint src/components/ui` 
Expected: no errors. (Screens may still fail tsc until Task 4-7; that's expected. Do NOT run `pnpm build` here if screens reference removed Modal/Drawer — they still exist until Task 8, so build may actually still pass; if it passes, great.)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui package.json pnpm-lock.yaml
git commit -m "feat: add shadcn component set; extend button sizes + badge variants"
```

---

## Task 3: Composed local components — DatePicker + ConfirmDialog

**Files:**
- Create: `src/components/ui/date-picker.tsx`
- Create: `src/components/ui/confirm-dialog.tsx`

- [ ] **Step 1: Create `src/components/ui/date-picker.tsx`**

```tsx
import { CalendarIcon } from 'lucide-react'
import { format, parse, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày',
  className,
}: DatePickerProps) {
  const selected =
    value && isValid(parse(value, 'yyyy-MM-dd', new Date()))
      ? parse(value, 'yyyy-MM-dd', new Date())
      : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selected ? format(selected, 'dd/MM/yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={vi}
          selected={selected}
          onSelect={(d) => {
            if (d) onChange(format(d, 'yyyy-MM-dd'))
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Create `src/components/ui/confirm-dialog.tsx`**

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export interface ConfirmState {
  title: string
  description?: string
  confirmText?: string
  danger?: boolean
  onConfirm: () => void
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  danger?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Xác nhận',
  danger,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              danger &&
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 3: Verify lint**

Run: `pnpm exec eslint src/components/ui/date-picker.tsx src/components/ui/confirm-dialog.tsx`
Expected: no errors. (If `Calendar`'s `onSelect`/`mode` types differ in the generated calendar, adjust the handler to match — the generated calendar is `react-day-picker` v9 whose single-mode `onSelect` is `(date: Date | undefined) => void`.)

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/date-picker.tsx src/components/ui/confirm-dialog.tsx
git commit -m "feat: add composed DatePicker + ConfirmDialog"
```

---

## Task 4: Refactor DataTable onto shadcn Table

**Files:**
- Modify: `src/components/ui/data-table.tsx`

The public props (`columns`, `data`, `globalFilter`, `onRowClick`, `pageSize`, `emptyMessage`) MUST stay identical so departments/employees don't change.

- [ ] **Step 1: Rewrite `src/components/ui/data-table.tsx`** using shadcn Table parts

```tsx
import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { cn } from '@/lib/utils'

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  globalFilter?: string
  onRowClick?: (row: TData) => void
  pageSize?: number
  emptyMessage?: string
}

export function DataTable<TData>({
  columns,
  data,
  globalFilter,
  onRowClick,
  pageSize = 20,
  emptyMessage,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table manages its own memoization
  const table = useReactTable<TData>({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const rows = table.getRowModel().rows

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sortDir = header.column.getIsSorted()
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        disabled={!canSort}
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          'inline-flex items-center gap-1',
                          canSort && 'cursor-pointer hover:text-foreground',
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {sortDir === 'asc' && <ChevronUp className="size-3" />}
                        {sortDir === 'desc' && <ChevronDown className="size-3" />}
                      </button>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <Empty title={emptyMessage ?? 'Không có dữ liệu'} />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
        <span>
          Hiển thị {rows.length} / {data.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

Run: `pnpm exec eslint src/components/ui/data-table.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/data-table.tsx
git commit -m "refactor: DataTable onto shadcn Table parts"
```

---

## Task 5: Rewrite simple screens (Select-only / Table-only)

These screens have no Modal/Sheet/Drawer — only native `<select>` and/or raw table parts. Convert each. Read each file first; apply the idiomatic snippets from the top of this plan.

**Files:** `src/screens/products.tsx`, `src/screens/operations.tsx`, `src/screens/reports.tsx`, `src/screens/rates.tsx`, `src/screens/dashboard.tsx`

- [ ] **Step 1: products.tsx** — uses StatCard + search Input + card grid; no `<select>`/table. Only change: ensure imports resolve (Card/Badge/Button/Input now shadcn). No structural change. Verify `pnpm exec eslint src/screens/products.tsx`.

- [ ] **Step 2: operations.tsx** — replace the raw `Table/THead/TH/TR/TD` import from `../components/ui/table` with shadcn `Table/TableHeader/TableHead/TableRow/TableCell/TableBody` from `@/components/ui/table`, and rewrite the table markup using those parts (header row in `<TableHeader><TableRow><TableHead>…`, body in `<TableBody>`). Keep columns Mã/Tên/Trạng thái/actions. Verify eslint.

- [ ] **Step 3: reports.tsx** — replace the period `<Select>` (native) with shadcn `Select` (value=periodId, onValueChange; options = periods, each `SelectItem value={p.id}`). Replace the top-earners raw table parts with shadcn Table parts. Keep stat cards + breakdown bars. Verify eslint.

- [ ] **Step 4: rates.tsx** — replace the raw rates table parts with shadcn Table parts. The left product list is plain buttons (keep). The inline unit-price `Input` stays (shadcn Input). Verify eslint.

- [ ] **Step 5: dashboard.tsx** — only Card/Badge/Button usages; ensure they resolve to shadcn. No `<select>`/Modal. The StatCard component stays (it uses Card/CardBody). Verify eslint. NOTE: shadcn Card has `CardContent` not `CardBody`; our local StatCard + other screens use `CardBody`/`CardHeader`/`CardTitle`/`CardDesc` names. To avoid renaming across many files, in Task 2 the Card was REPLACED by shadcn which exports `CardHeader/CardTitle/CardDescription/CardContent/CardFooter/CardAction`. THIS IS A BREAKING NAME CHANGE. Handle it in Task 6 Step 0 below before screens compile.

- [ ] **Step 6: Commit**

```bash
git add src/screens/products.tsx src/screens/operations.tsx src/screens/reports.tsx src/screens/rates.tsx src/screens/dashboard.tsx
git commit -m "refactor: simple screens to shadcn Select/Table"
```

---

## Task 6: Reconcile Card API + rewrite Card-heavy usages

**Problem:** shadcn `card.tsx` exports `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction`. Our code uses `CardBody` (→ `CardContent`) and `CardDesc` (→ `CardDescription`). Rather than edit ~10 screens, add compatibility aliases.

**Files:** `src/components/ui/card.tsx`, and any screen still importing `CardBody`/`CardDesc`.

- [ ] **Step 1: Add aliases to the generated `src/components/ui/card.tsx`**

At the END of the generated file, add:
```tsx
// Back-compat aliases for existing screens
export { CardContent as CardBody, CardDescription as CardDesc }
```
(Keep all generated exports. This avoids touching every Card usage.)

- [ ] **Step 2: Verify the alias resolves**

Run: `pnpm exec eslint src/components/ui/card.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: CardBody/CardDesc back-compat aliases on shadcn Card"
```

---

## Task 7: Rewrite Dialog/Select screens (departments, accounts, attendances, salary-periods)

Read each file. Convert native `<select>` → shadcn `Select`; `Modal` → `Dialog`; `<input type="date">` → `DatePicker`; `useConfirm()` → `ConfirmDialog` + `confirmState`. Raw `Table` parts → shadcn Table parts.

**Files:** `src/screens/departments.tsx`, `src/screens/accounts.tsx`, `src/screens/attendances.tsx`, `src/screens/salary-periods.tsx`

- [ ] **Step 1: departments.tsx**
  - Remove `import { Modal } from '../components/ui/modal'` and `import { useConfirm } from '../components/ui/confirm'`. Add `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'`, `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'`, `import { ConfirmDialog, type ConfirmState } from '@/components/ui/confirm-dialog'`.
  - Replace the status `<Select>` (native, value `'active'|'inactive'`) with shadcn Select using `value={editing.isActive ? 'active' : 'inactive'}` and `onValueChange={(v) => setEditing({ ...editing, isActive: v === 'active' })}`, items `active`/`inactive`.
  - Replace `<Modal open … title … footer …>` with the Dialog snippet; move the footer buttons into `<DialogFooter>`.
  - Replace `useConfirm`: delete `const { confirm, node: confirmNode } = useConfirm()`; add `const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)`. Change `remove(d)` to set `confirmState` with `onConfirm: async () => { await removeMut.mutateAsync(d.id); toast.success('Đã xóa', { description: d.name }) }`. Replace `{confirmNode}` render with the `<ConfirmDialog … />` snippet.
  - Verify `pnpm exec eslint src/screens/departments.tsx`.

- [ ] **Step 2: accounts.tsx**
  - Replace native `<Select>`s (role filter, status filter, employee link, status in modal) with shadcn Select. Use sentinel `"all"` for the filter Selects (already used). For the employee link Select, since there's a "— Không liên kết —" option, use sentinel value `"none"` and map `"none"` ↔ `null` for `employeeId`.
  - Replace `Modal` → `Dialog` (the create/edit account modal). Footer → `DialogFooter`.
  - The role multi-select stays as the checkbox list (it's not a Select). Keep.
  - Verify eslint.

- [ ] **Step 3: attendances.tsx**
  - Replace the employee filter `<select>` and the modal's employee `<select>` with shadcn Select (employee filter uses sentinel `"all"`).
  - Replace the two `<input type="date">` filter fields (fromDate/toDate) and the modal `workDate` with `<DatePicker>`.
  - Replace `Modal` ("Nhập công") → `Dialog`. Keep `Input type="time"` for checkIn/checkOut.
  - Replace raw `Table` parts with shadcn Table parts.
  - Verify eslint.

- [ ] **Step 4: salary-periods.tsx**
  - Replace the status filter `<select>` with shadcn Select (sentinel `"all"`).
  - Replace `Modal` ("Tạo kỳ") → `Dialog`. Replace the fromDate/toDate `<input type="date">` with `<DatePicker>`.
  - Replace `useConfirm` with `ConfirmDialog` + `confirmState` (lock/paid actions set `confirmState`). Replace raw `Table` parts with shadcn Table parts.
  - Verify eslint.

- [ ] **Step 5: Commit**

```bash
git add src/screens/departments.tsx src/screens/accounts.tsx src/screens/attendances.tsx src/screens/salary-periods.tsx
git commit -m "refactor: Dialog/Select/DatePicker/ConfirmDialog screens"
```

---

## Task 8: Rewrite Sheet/Tabs screens (employees, payroll-runs) + roles + audit-logs

**Files:** `src/screens/employees.tsx`, `src/screens/payroll-runs.tsx`, `src/screens/roles.tsx`, `src/screens/audit-logs.tsx`

- [ ] **Step 1: employees.tsx**
  - Replace `import { Drawer } from '../components/ui/drawer'` with `import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'`.
  - Convert the `EmployeeDrawer` body: `<Sheet open onOpenChange={(o) => { if (!o) onClose() }}><SheetContent side="right" className="w-[560px] sm:max-w-[560px] flex flex-col">…`. Header → `SheetHeader/SheetTitle/SheetDescription`; footer buttons → `SheetFooter`. Keep the `key`-based remount in the parent.
  - Replace the department + salaryCalculationType + status native `<select>`s with shadcn Select.
  - Verify eslint.

- [ ] **Step 2: payroll-runs.tsx**
  - Replace `Drawer` → `Sheet` (the payroll detail). 
  - Replace the status-filter `Tabs` (tabs=[] custom) with shadcn `Tabs`/`TabsList`/`TabsTrigger` (values all/calculated/confirmed; keep the `setTab` cast).
  - Replace `useConfirm` (generate) with `ConfirmDialog` + `confirmState`.
  - Replace raw `Table` parts with shadcn Table parts.
  - Verify eslint.

- [ ] **Step 3: roles.tsx**
  - No Modal/Drawer. Replace any native `<Select>` (there is a permission/role filter? if present) with shadcn Select. The permission checkboxes stay. Verify eslint.

- [ ] **Step 4: audit-logs.tsx**
  - Replace the action-type native `<select>` with shadcn Select (sentinel `"all"`). Replace the two date `<input type="date">` with `<DatePicker>` (they are static no-op filters; wire to local state so the DatePicker has a value/onChange). Verify eslint.

- [ ] **Step 5: Commit**

```bash
git add src/screens/employees.tsx src/screens/payroll-runs.tsx src/screens/roles.tsx src/screens/audit-logs.tsx
git commit -m "refactor: Sheet/Tabs screens + roles/audit-logs selects"
```

---

## Task 9: Delete old primitives, wire providers, full verification

**Files:** delete `modal.tsx`/`drawer.tsx`/`confirm.tsx`; modify `src/App.tsx`; verify layout.

- [ ] **Step 1: Delete the obsolete primitives**

```bash
git rm src/components/ui/modal.tsx src/components/ui/drawer.tsx src/components/ui/confirm.tsx
```

- [ ] **Step 2: Grep for stragglers**

Run:
```bash
grep -rn "ui/modal\|ui/drawer\|ui/confirm'\|useConfirm\|from '../components/ui/select'\|from '../components/ui/tabs'" src
```
Expected: NO output. Fix any hit (a screen still importing a deleted/old module).

- [ ] **Step 3: Add TooltipProvider (only if any Tooltip is used)**

If any screen used `Tooltip`, wrap the app: in `src/App.tsx` import `{ TooltipProvider } from '@/components/ui/tooltip'` and wrap the `<BrowserRouter>` subtree. If no Tooltip is used anywhere, skip this step.

- [ ] **Step 4: Full typecheck + build**

Run: `pnpm build`
Expected: tsc passes, vite build writes `dist/`. Fix any error:
- Missing Button `size`/Badge `variant` → ensure Task 2 extensions are present.
- `CardBody`/`CardDesc` import errors → ensure Task 6 aliases exist.
- Select empty-value runtime is not a tsc error, but ensure no `<SelectItem value="">` exists (use sentinels).
Re-run until clean.

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: `ESLint: No issues found`. Fix issues (unused imports from removed primitives; type-only imports must use `import type`; the generated shadcn files may need a `// eslint-disable` only if they trip a rule — prefer fixing).

- [ ] **Step 6: Dev smoke test**

Run `pnpm dev` (background). In the browser:
1. Open a Dialog (departments "Thêm phòng ban") — opens, escape closes, overlay click closes, focus trapped.
2. Open the employees Sheet — slides from right, close works.
3. A Select (employees department filter) — opens, keyboard arrows, selection updates.
4. DatePicker (salary-periods "Tạo kỳ" fromDate) — popover calendar, pick date, trigger shows dd/MM/yyyy, bound value is YYYY-MM-DD.
5. A destructive action (departments delete) — AlertDialog confirm/cancel.
6. Tabs (payroll-runs status filter) switch.
7. Confirm the indigo primary + rounded corners look unchanged.
Stop dev server (`pkill -f vite`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove old primitives; shadcn migration build + lint clean"
```

---

## Self-Review Notes (author)

- **Spec coverage:** CLI init + components.json (T1), theme reconcile keeping brand (T1 Step 3), add all components (T2), Button/Badge variant parity (T2), DatePicker + ConfirmDialog (T3), DataTable on shadcn Table (T4), idiomatic Dialog/Sheet/Select/Tabs/AlertDialog across all 13 screens (T5/T7/T8), delete modal/drawer/confirm (T9), sonner kept (unchanged), avatar/empty kept (untouched). All present.
- **Known sharp edges flagged in-plan:** (a) Card export rename `CardBody→CardContent` handled via aliases (T6); (b) Button sizes `md`/`iconsm` and Badge `success`/`warning`/`muted` re-added (T2); (c) shadcn Select forbids empty-string values → sentinels `"all"`/`"none"` (T7/T8); (d) CLI non-interactivity via pre-made components.json + `--yes` (T1/T2), with BLOCKED escalation if init can't detect config.
- **Type consistency:** `ConfirmState`/`ConfirmDialogProps` defined in T3 and consumed in T7/T8; `DatePicker` props (`value: string`, `onChange: (v: string) => void`) consistent across T7/T8; DataTable public props unchanged (T4) so departments/employees call sites untouched.
- **Ordering:** T6 (Card alias) must land before a full `pnpm build`; it is committed before T7/T8 which is before the T9 build gate. Individual screen tasks verify with `eslint` (not full build) until T9, because removed primitives still exist until T9 — the full green build is the T9 gate.

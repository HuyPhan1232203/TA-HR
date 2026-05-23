# shadcn/ui Migration — Design

**Date:** 2026-05-23
**Status:** Approved (design); pending implementation plan

## Goal

Replace the hand-rolled "shadcn-style" Tailwind primitives in `src/components/ui/*`
with real shadcn/ui (Radix-based) components installed via the official CLI, and
rewrite every screen to use the canonical shadcn component APIs — Dialog, Sheet,
Select, Tabs, AlertDialog, and a composed DatePicker. Preserve the existing
indigo-blue oklch brand.

## Decisions (locked)

| Topic | Decision |
| --- | --- |
| Install method | Official `npx shadcn@latest` CLI (`init` + `add`). |
| Scope | Replace **all** custom primitives with shadcn equivalents. |
| Theme | Keep the current indigo brand: primary `oklch(0.5635 0.2408 260.8178)`, radius `0.625rem`, Inter/JetBrains fonts. Adopt shadcn's CSS-var structure for neutral grays/borders; base color **neutral**. |
| API style | **Idiomatic** shadcn at call sites (`<Dialog><DialogContent>…`, `<Select><SelectTrigger><SelectItem>…`), not compatibility wrappers. |
| Toast | Keep `sonner` (already shadcn's recommended toast). |
| Migration strategy | Big-bang on a dedicated branch — one consistent cutover, no half-shadcn intermediate. |
| Time inputs | Stay as `Input type="time"` (shadcn has no official time picker). |

## Setup & theme reconciliation

1. `npx shadcn@latest init` — Tailwind v4 mode, base color neutral, `@/` alias (already configured in `vite.config.ts` + `tsconfig.app.json`). Produces `components.json`.
2. The CLI rewrites `src/index.css`. **Reconcile**, do not blindly accept:
   - Keep the `@theme` brand tokens already present: `--color-primary: oklch(0.5635 0.2408 260.8178)`, `--color-ring`, `--radius: 0.625rem`, `--font-sans`/`--font-mono`, plus the custom utilities `.scrollbar-thin`, `.num`, `@keyframes shimmer/fadeIn/pop`, `.fade-in`, `.pop-in`.
   - Adopt shadcn's `:root` / `.dark` CSS-variable block for the neutral surface/border/muted/accent tokens so Radix components inherit correct theming.
   - Net: components render on Radix but the visual brand (indigo primary, radius, fonts) is unchanged.
3. Dependencies the CLI adds as needed: per-component Radix packages, `react-day-picker` + `date-fns` (calendar), `tw-animate-css` (Tailwind v4 animations). Existing `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` are reused.

## Components to add

Via `npx shadcn@latest add`: `button card input label textarea badge tabs table dialog sheet select popover calendar alert-dialog dropdown-menu tooltip`.

Composed/local files (not from CLI):
- `src/components/ui/date-picker.tsx` — Popover + Calendar, `vi` locale, value as `Date | undefined`, emits `YYYY-MM-DD` string via `date-fns/format`.
- `src/components/ui/confirm-dialog.tsx` — reusable controlled confirm built on `AlertDialog`.
- `src/components/ui/empty.tsx` — keep the existing tiny Empty state (no shadcn equivalent); re-add if the CLI overwrites the `ui` dir.

## Old → new mapping

| Current (`src/components/ui`) | shadcn replacement | Call sites affected |
| --- | --- | --- |
| `modal.tsx` (`Modal` open/title/footer) | `Dialog` + `DialogContent/Header/Title/Description/Footer` | departments, accounts, attendances ("Nhập công"), salary-periods ("Tạo kỳ") |
| `drawer.tsx` (`Drawer`) | `Sheet` + `SheetContent side="right"/Header/Title/Footer` | employees (edit/create), payroll-runs (detail) |
| `select.tsx` (native `<select>`) | `Select`+`SelectTrigger`+`SelectValue`+`SelectContent`+`SelectItem` | every filter/form select across screens |
| native `<input type="date">` | `DatePicker` | salary-periods (fromDate/toDate), attendances (workDate, fromDate/toDate) |
| `tabs.tsx` (`Tabs` tabs=[]) | `Tabs`+`TabsList`+`TabsTrigger`(+`TabsContent` where useful) | payroll-runs (status filter), attendances (if any) |
| `confirm.tsx` (`useConfirm()` promise) | `ConfirmDialog` over `AlertDialog` (controlled) | departments, salary-periods (lock/paid), payroll-runs (generate) |
| `button/card/input/label/textarea/badge` | shadcn equivalents | mostly drop-in (props align) |
| `table.tsx` (`Table/THead/TH/TR/TD`) | shadcn `Table/TableHeader/TableHead/TableRow/TableCell/TableBody` | screens using raw table parts (salary-periods, payroll-runs, reports, operations, rates, accounts, employees-drawer) + `data-table.tsx` |
| `data-table.tsx` (custom `<table>`) | refactor internals onto shadcn `Table`; **public props unchanged** | departments, employees (no call-site change) |
| row "more"/action buttons | `DropdownMenu` (optional polish where a menu fits) | employees, accounts |

## Idiomatic API patterns (reference)

- **Dialog:** controlled via `open`/`onOpenChange`; `<Dialog open={x} onOpenChange={setX}><DialogContent><DialogHeader><DialogTitle/><DialogDescription/></DialogHeader>…<DialogFooter/></DialogContent></Dialog>`. No `DialogTrigger` needed when opened imperatively from a button handler.
- **Sheet:** same shape with `<SheetContent side="right">`.
- **Select:** `<Select value={v} onValueChange={setV}><SelectTrigger><SelectValue placeholder="…"/></SelectTrigger><SelectContent><SelectItem value="…">…</SelectItem></SelectContent></Select>`. Note: shadcn Select has no empty-string value — use a sentinel like `"all"` for "no filter" (screens already use `"all"`).
- **Tabs:** `<Tabs value={v} onValueChange={setV}><TabsList><TabsTrigger value="…"/></TabsList></Tabs>`.
- **ConfirmDialog:** `<ConfirmDialog open onOpenChange title description danger confirmText onConfirm/>`; screen holds a `confirm` state object (`{ title, description, danger?, onConfirm }`) instead of `await confirm()`.

## Confirm dialog detail

Replace the promise-based `useConfirm`. New `ConfirmDialog`:
```
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  danger?: boolean
  onConfirm: () => void
}
```
Screens that previously did `const ok = await confirm({…}); if (ok) …` now set a
`pending` state object and render one `<ConfirmDialog>` whose `onConfirm` runs the
action. Removes `confirm.tsx`'s promise machinery.

## Date handling

`DatePicker` props: `{ value?: string /* YYYY-MM-DD */, onChange: (v: string) => void, placeholder? }`.
Internally parses to `Date` for the Calendar, formats back with
`format(date, 'yyyy-MM-dd')`. Calendar uses `vi` locale from `date-fns/locale`.
Time fields (checkIn/checkOut in attendances) stay `Input type="time"`.

## Files

**Replaced (CLI-generated):** `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`,
`textarea.tsx`, `badge.tsx`, `tabs.tsx`, `table.tsx`, plus new `dialog.tsx`,
`sheet.tsx`, `select.tsx`, `popover.tsx`, `calendar.tsx`, `alert-dialog.tsx`,
`dropdown-menu.tsx`, `tooltip.tsx`.
**New local:** `date-picker.tsx`, `confirm-dialog.tsx`.
**Deleted:** `modal.tsx`, `drawer.tsx`, `confirm.tsx`.
**Kept:** `empty.tsx`, `query-state.tsx`, `avatar.tsx` (custom initials avatar — shadcn Avatar is image-based; keep ours), `toast` via sonner.
**Refactored:** `data-table.tsx` (internals only).
**Rewritten:** all 13 screens' interactive markup; `App.tsx` (sonner `<Toaster>` already there; add `<TooltipProvider>` if tooltips used).

## Error handling

No behavior change. Radix handles focus-trap/escape/overlay. Form validation and
toast error paths unchanged. Select sentinel `"all"` avoids the empty-value
constraint.

## Testing / verification

No test runner. Gate on `pnpm build` (tsc) + `pnpm lint` clean. Dev smoke:
open/close each Dialog + Sheet, Select keyboard nav + selection, DatePicker pick a
date and confirm the bound `YYYY-MM-DD` value, AlertDialog confirm/cancel, Tabs
switch. Confirm the indigo brand + radius look unchanged.

## Out of scope

- New features or screens.
- Time picker component.
- Replacing the custom initials `Avatar`.
- Dark mode polish beyond what shadcn tokens provide for free.

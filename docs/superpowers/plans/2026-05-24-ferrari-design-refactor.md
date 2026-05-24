# Ferrari Design-Language Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the TA-HR admin app in the Ferrari design language (`DESIGN.md`) — near-black dark chrome, Rosso Corsa accent, sharp corners, white data bands — by rewriting theme tokens and shared shadcn primitives so all 15 screens inherit.

**Architecture:** Dark is the global default in Tailwind v4 `@theme`. A single `.band-light` class re-declares color custom-properties for white editorial bands; it is pushed into shared `DataTable` / modal primitives so screens flip data surfaces to light with zero per-screen work. Sharp corners come from zeroing the `--radius-*` scale (form inputs overridden back to 4px). Restyling shared primitives (`Button`, `Card`, `Badge`, inputs, `Table`, modals) propagates across every screen.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (CSS-first `@theme`), shadcn/ui (radix-ui), Vite, pnpm. No test runner configured — **verification gate per task is `pnpm build` (tsc + vite) and `pnpm lint` passing clean, plus the described visual check on `pnpm dev`.** This is a visual CSS refactor, so the usual TDD red/green is replaced by build+lint+visual gates.

---

## Notes for the implementer (read once)

- **No `.dark` class is used.** We make dark the default by setting `@theme` color tokens to Ferrari dark values. shadcn's `dark:` utility classes therefore stay inactive — that is intentional and fine; base classes resolve through the (now dark) tokens.
- `.band-light` works because Tailwind v4 color utilities compile to `var(--color-*)`. Re-declaring those properties on a `.band-light` element overrides them for the whole subtree via CSS inheritance.
- `rounded-full` (badges) is a literal in Tailwind v4, not a `--radius-*` var, so zeroing the radius scale does not affect pills.
- Run the app with `pnpm dev` (Vite, default http://localhost:5173). Login user is prefilled (`huong.tt` / `password`) — the backend at `VITE_API_URL` must be reachable for data, but token/component styling is visible regardless.
- Vietnamese text uppercases cleanly; no special handling.
- Commit after each task. Branch is `main`; create a feature branch first (Task 0).

---

## File map

| File | Responsibility | Change |
|---|---|---|
| `src/index.css` | Theme tokens, `.band-light`, radius scale | Rewrite color tokens + radius; add `.band-light` |
| `src/components/ui/button.tsx` | Button variants | uppercase/tracking/sharp; destructive→outline |
| `src/components/ui/card.tsx` | Card surface | sharp, remove shadow |
| `src/components/ui/badge.tsx` | Badge/pill | uppercase 11px pill |
| `src/components/ui/input.tsx` | Text input | 4px corners |
| `src/components/ui/textarea.tsx` | Textarea | 4px corners |
| `src/components/ui/select.tsx` | Select trigger | 4px corners |
| `src/components/ui/table.tsx` | Table head | editorial uppercase head |
| `src/components/ui/dialog.tsx` | Modal form surface | `band-light` |
| `src/components/ui/sheet.tsx` | Drawer form surface | `band-light` |
| `src/components/ui/alert-dialog.tsx` | Confirm modal surface | `band-light` |
| `src/components/ui/confirm-dialog.tsx` | Danger action | use destructive variant |
| `src/components/ui/data-table.tsx` | Data table region | wrap in `band-light` band |
| `src/components/layout/sidebar.tsx` | Dark nav chrome | Rosso-scarce active state, logo |
| `src/components/layout/topbar.tsx` | Dark top chrome | (inherits; verify) |
| `src/components/layout/page-header.tsx` | Page display type | negative tracking, weight 500 |
| `src/screens/login.tsx` | Login hero | dark cinematic left + light form right |
| `src/screens/dashboard.tsx` | Dashboard | remove inline oklch deltas → tokens |

---

## Task 0: Feature branch

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/ferrari-design-refactor
```

- [ ] **Step 2: Baseline build to confirm green start**

Run: `pnpm build && pnpm lint`
Expected: both succeed (clean baseline before changes).

---

## Task 1: Theme tokens, radius, and `.band-light`

**Files:**
- Modify: `src/index.css:6-50` (the `@theme` block) and add a `.band-light` rule.

- [ ] **Step 1: Replace the `@theme` block** (`src/index.css`)

Replace the entire `@theme { ... }` block (currently lines 6-50) with:

```css
@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Ferrari dark canvas — global default */
  --color-background: #181818;
  --color-foreground: #ffffff;
  --color-card: #303030;
  --color-card-foreground: #ffffff;
  --color-popover: #303030;
  --color-popover-foreground: #ffffff;
  --color-primary: #da291c; /* Rosso Corsa */
  --color-primary-foreground: #ffffff;
  --color-secondary: #303030;
  --color-secondary-foreground: #ffffff;
  --color-muted: #303030;
  --color-muted-foreground: #969696;
  --color-accent: #303030;
  --color-accent-foreground: #ffffff;
  --color-destructive: #da291c; /* rendered as outline; see button.tsx */
  --color-destructive-foreground: #ffffff;
  --color-success: #03904a;
  --color-success-foreground: #ffffff;
  --color-warning: #f13a2c;
  --color-warning-foreground: #181818;
  --color-border: #303030; /* hairline on dark */
  --color-input: #303030;
  --color-ring: #fff200; /* Hypersail yellow focus ring */
  --color-sidebar: #181818;
  --color-sidebar-foreground: #ffffff;
  --color-sidebar-border: #303030;
  --color-sidebar-accent: #303030;
  --color-sidebar-accent-foreground: #ffffff;

  /* Sharp by default — the brand signature */
  --radius: 0rem;
  --radius-sm: 0rem;
  --radius-md: 0rem;
  --radius-lg: 0rem;
  --radius-xl: 0rem;

  /* Rosso ramp for charts */
  --color-chart-1: #da291c;
  --color-chart-2: #b01e0a;
  --color-chart-3: #9d2211;
  --color-chart-4: #f13a2c;
  --color-chart-5: #969696;
}
```

- [ ] **Step 2: Add the `.band-light` rule** (`src/index.css`)

Immediately AFTER the closing `}` of the `@layer base { ... }` block (currently ends line 69), add:

```css
/* White editorial band — Ferrari preowned/pricing surface. */
.band-light {
  --color-background: #ffffff;
  --color-foreground: #181818;
  --color-card: #f7f7f7;
  --color-card-foreground: #181818;
  --color-popover: #ffffff;
  --color-popover-foreground: #181818;
  --color-secondary: #ebebeb;
  --color-secondary-foreground: #181818;
  --color-muted: #ebebeb;
  --color-muted-foreground: #666666;
  --color-accent: #ebebeb;
  --color-accent-foreground: #181818;
  --color-border: #d2d2d2;
  --color-input: #d2d2d2;
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

- [ ] **Step 3: Update scrollbar thumb for dark canvas** (`src/index.css:76`)

Change the scrollbar thumb color so it is visible on dark. Replace:

```css
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: oklch(0.85 0 0);
  border-radius: 999px;
}
```

with:

```css
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 999px;
}
```

- [ ] **Step 4: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: both PASS (no type/lint errors).

- [ ] **Step 5: Visual check**

Run `pnpm dev`, open the app. Expected: background is near-black `#181818`, text white. Cards/tables may still look rough — later tasks fix them. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/index.css
git commit -m "feat(theme): Ferrari dark tokens, sharp radius, band-light"
```

---

## Task 2: Button — uppercase, sharp, destructive→outline

**Files:**
- Modify: `src/components/ui/button.tsx:7-39` (the `cva` definition).

- [ ] **Step 1: Replace the `buttonVariants` cva** (`src/components/ui/button.tsx`)

Replace the entire `const buttonVariants = cva( ... )` (lines 7-39) with:

```tsx
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-none text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground uppercase tracking-[0.1em] font-semibold hover:bg-primary/90",
        destructive:
          "border border-destructive bg-transparent text-destructive uppercase tracking-[0.1em] font-semibold hover:bg-destructive/10",
        outline:
          "border border-input bg-transparent text-foreground uppercase tracking-[0.1em] font-semibold hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground uppercase tracking-[0.1em] font-semibold hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

(Changes: base `rounded-md`→`rounded-none`; removed all `rounded-md` from sizes; removed `shadow-xs` and dark-specific classes from variants; added `uppercase tracking-[0.1em] font-semibold` to filled/outline variants; `ghost`/`link` stay normal-case; **destructive is now transparent + Rosso border/text**.)

- [ ] **Step 2: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Visual check**

Run `pnpm dev`, open `/dashboard`. Expected: "Xuất báo cáo" (outline) and "Tạo kỳ lương" (solid Rosso) buttons render uppercase, tracked, sharp corners. Delete/danger buttons (e.g. open any row → delete) show red outline, not red fill.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat(button): uppercase sharp CTAs; destructive outline"
```

---

## Task 3: Card — sharp, hairline, no shadow

**Files:**
- Modify: `src/components/ui/card.tsx:5-16` (the `Card` function).

- [ ] **Step 1: Replace the `Card` className** (`src/components/ui/card.tsx`)

In the `Card` function, change the `cn(...)` class string from:

```tsx
        "flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm",
```

to:

```tsx
        "flex flex-col gap-6 rounded-none border bg-card py-6 text-card-foreground",
```

(Removed `shadow-sm`; `rounded-xl`→`rounded-none`. Border uses the hairline token.)

- [ ] **Step 2: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Visual check**

`pnpm dev` → `/dashboard`. Expected: stat cards and the activity card render as flat dark `#303030` panels with sharp corners, 1px hairline border, no drop shadow.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat(card): sharp flat dark surface, hairline border"
```

---

## Task 4: Badge — uppercase 11px pill

**Files:**
- Modify: `src/components/ui/badge.tsx:7-8` (cva base string).

- [ ] **Step 1: Edit the badge base string** (`src/components/ui/badge.tsx`)

In the `badgeVariants` cva, change the base string opening from:

```tsx
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] ...
```

so that `text-xs font-medium` becomes `text-[11px] font-semibold uppercase tracking-wider`. The resulting opening is:

```tsx
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3",
```

(Keep the rest of the cva — the `variants` object — unchanged. `px-2`→`px-2.5` for the wider pill.)

- [ ] **Step 2: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Visual check**

`pnpm dev` → `/dashboard`. Expected: module badges in the activity list render as uppercase 11px pills.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat(badge): uppercase 11px pill"
```

---

## Task 5: Form controls — 4px corners

**Files:**
- Modify: `src/components/ui/input.tsx:11`, `src/components/ui/textarea.tsx:10`, `src/components/ui/select.tsx:40`.

- [ ] **Step 1: Input** (`src/components/ui/input.tsx`)

In the `cn(...)` class string, change `rounded-md` → `rounded-[4px]`. (It appears once, in the long first string.)

- [ ] **Step 2: Textarea** (`src/components/ui/textarea.tsx`)

In the `cn(...)` class string, change `rounded-md` → `rounded-[4px]`.

- [ ] **Step 3: Select trigger** (`src/components/ui/select.tsx`)

In `SelectTrigger`'s `cn(...)` string, change `rounded-md` → `rounded-[4px]`.

- [ ] **Step 4: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Visual check**

`pnpm dev` → `/login` (inputs) and any screen with a Select filter. Expected: inputs/selects have subtle 4px corners (not sharp, not the old 10px). Focus ring is yellow.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/input.tsx src/components/ui/textarea.tsx src/components/ui/select.tsx
git commit -m "feat(forms): 4px corners on inputs/textarea/select"
```

---

## Task 6: Table — editorial uppercase head

**Files:**
- Modify: `src/components/ui/table.tsx:66-77` (`TableHead`).

- [ ] **Step 1: Edit `TableHead` className** (`src/components/ui/table.tsx`)

Change the `TableHead` `cn(...)` string from:

```tsx
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
```

to:

```tsx
        "h-10 px-2 text-left align-middle text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
```

- [ ] **Step 2: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Visual check**

(Best verified after Task 8 wraps the table in a light band.) `pnpm dev` → `/employees`. Expected: column headers render uppercase, tracked, muted.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/table.tsx
git commit -m "feat(table): editorial uppercase column heads"
```

---

## Task 7: Modal surfaces → light band

**Files:**
- Modify: `src/components/ui/dialog.tsx:64`, `src/components/ui/sheet.tsx:61`, `src/components/ui/alert-dialog.tsx:59`, `src/components/ui/confirm-dialog.tsx:51-59`.

- [ ] **Step 1: DialogContent** (`src/components/ui/dialog.tsx`)

In `DialogContent`'s `cn(...)`, change `rounded-lg border bg-background p-6 shadow-lg` → `band-light rounded-none border bg-background p-6 shadow-lg`. (Add `band-light`, `rounded-lg`→`rounded-none`.)

- [ ] **Step 2: SheetContent** (`src/components/ui/sheet.tsx`)

In `SheetContent`'s first `cn(...)` segment, change `"fixed z-50 flex flex-col gap-4 bg-background shadow-lg ...` → add `band-light` after `fixed z-50`:

```tsx
          "fixed z-50 band-light flex flex-col gap-4 bg-background shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500",
```

- [ ] **Step 3: AlertDialogContent** (`src/components/ui/alert-dialog.tsx`)

In `AlertDialogContent`'s `cn(...)`, change `rounded-lg border bg-background p-6 shadow-lg` → `band-light rounded-none border bg-background p-6 shadow-lg`.

- [ ] **Step 4: confirm-dialog danger uses destructive variant** (`src/components/ui/confirm-dialog.tsx`)

Replace the `<AlertDialogAction>` block (lines 51-59) with:

```tsx
          <AlertDialogAction
            variant={danger ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
```

Then remove the now-unused `cn` import at the top (line 11: `import { cn } from '@/lib/utils'`).

- [ ] **Step 5: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS (no unused-import lint error from removing `cn`).

- [ ] **Step 6: Visual check**

`pnpm dev` → `/employees`, open a create/edit dialog. Expected: dialog renders as a WHITE editorial band (dark text), sharp corners, while the page behind stays dark. Trigger a delete confirm: danger button is red-outline.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/sheet.tsx src/components/ui/alert-dialog.tsx src/components/ui/confirm-dialog.tsx
git commit -m "feat(modals): white editorial band for dialogs/sheets/alerts"
```

---

## Task 8: DataTable → light editorial band

**Files:**
- Modify: `src/components/ui/data-table.tsx:59-60` (outer wrapper div).

- [ ] **Step 1: Wrap the table region in a light band** (`src/components/ui/data-table.tsx`)

Change the outer return wrapper from:

```tsx
  return (
    <div>
      <Table>
```

to:

```tsx
  return (
    <div className="band-light border bg-background text-foreground">
      <Table>
```

(The pagination footer `border-t` divider already inside will now read against the light band.)

- [ ] **Step 2: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Visual check**

`pnpm dev` → `/employees`, `/departments`, `/accounts`. Expected: each data table sits in a white editorial band (dark text, hairline `#d2d2d2` row dividers, uppercase muted heads from Task 6), framed against the dark page. Pager "Trước/Sau" outline buttons read correctly on light.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/data-table.tsx
git commit -m "feat(data-table): white editorial band surface"
```

---

## Task 9: Sidebar + Topbar chrome

**Files:**
- Modify: `src/components/layout/sidebar.tsx:16,44-46`.
- Verify only: `src/components/layout/topbar.tsx` (inherits tokens; no edit expected).

- [ ] **Step 1: Logo plate + Rosso-scarce active state** (`src/components/layout/sidebar.tsx`)

The logo plate (line 16) currently `bg-primary` — keep it Rosso (the brand mark is a sanctioned Rosso use), but make it sharp. Change `rounded-lg` → `rounded-none` on line 16's `div`:

```tsx
        <div className="size-8 rounded-none bg-primary text-primary-foreground grid place-items-center font-bold text-sm">
```

(Also drop `shadow-sm` from that line.)

- [ ] **Step 2: Active nav item — keep Rosso scarce** (`src/components/layout/sidebar.tsx`)

Replace the active/inactive `NavLink` class branches (lines 44-46) so the active item uses an elevated surface + Rosso left indicator + Rosso text instead of a full Rosso fill:

```tsx
                      isActive
                        ? 'bg-sidebar-accent text-primary font-medium border-l-2 border-primary rounded-none'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
```

(Active item: `#303030` bg, Rosso text + 2px Rosso left border. Keeps red scarce per `DESIGN.md`. Note the `gap-2.5 px-2.5 h-8` and `rounded-md` from the shared part of the className on line 43 — change that `rounded-md`→`rounded-none` too.)

- [ ] **Step 3: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Visual check**

`pnpm dev`. Expected: sidebar is near-black, hairline divider to content; the active route shows an elevated row with a Rosso left bar + Rosso label; logo is a sharp Rosso plate. Topbar is dark with hairline bottom border, yellow focus ring on the search input.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(chrome): dark sidebar, Rosso-scarce active nav"
```

---

## Task 10: PageHeader display type

**Files:**
- Modify: `src/components/layout/page-header.tsx:14`.

- [ ] **Step 1: Tune the page title** (`src/components/layout/page-header.tsx`)

Change the `<h2>` className from:

```tsx
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
```

to:

```tsx
        <h2 className="text-3xl font-medium tracking-[-0.01em]">{title}</h2>
```

(Display weight 500 not bold, negative tracking, slightly larger — editorial confidence per `DESIGN.md`.)

- [ ] **Step 2: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Visual check**

`pnpm dev` → any screen. Expected: page heading reads as a confident weight-500 display line, not bold.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/page-header.tsx
git commit -m "feat(page-header): weight-500 display type"
```

---

## Task 11: Login — dark cinematic hero + light form

**Files:**
- Modify: `src/screens/login.tsx:63-69, 80, 114, 127-130`.

- [ ] **Step 1: Replace the left-panel gradient with the Ferrari dark cinema gradient** (`src/screens/login.tsx`)

Change the left panel `style` (lines 64-69) from the blue gradient to the brand dark/red gradient:

```tsx
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-12 text-primary-foreground relative overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, #3c3c3c 0%, #030303 64%)',
        }}
      >
```

- [ ] **Step 2: Add a Rosso accent bar instead of the dotted texture overlay** (`src/screens/login.tsx`)

Replace the dotted-texture overlay div (lines 70-77) with a single scarce Rosso gradient edge:

```tsx
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: 'linear-gradient(180deg, #a00c01, #da291c 64%)' }}
        />
```

- [ ] **Step 3: Sharpen the hero logo plate** (`src/screens/login.tsx:80`)

Change the logo plate `rounded-xl` → `rounded-none`:

```tsx
            <div className="size-10 rounded-none bg-white/15 backdrop-blur grid place-items-center font-bold">
```

- [ ] **Step 4: Sharpen the module chips** (`src/screens/login.tsx:114`)

Change the chip class `rounded-md` → `rounded-none`:

```tsx
                className="px-3 py-2 rounded-none bg-white/10 border border-white/15 text-xs font-medium backdrop-blur"
```

- [ ] **Step 5: Make the right form panel a light editorial band** (`src/screens/login.tsx:127-130`)

Change the right panel wrapper (line 127) and its mobile logo plate (line 130):

```tsx
      <div className="flex-1 flex items-center justify-center p-8 band-light bg-background text-foreground">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6 flex items-center gap-2.5">
            <div className="size-9 rounded-none bg-primary text-primary-foreground grid place-items-center font-bold">
```

- [ ] **Step 6: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 7: Visual check**

`pnpm dev` → `/login` (sign out if needed). Expected: left = dark cinematic panel with a thin Rosso edge and white display headline; right = white editorial form band with 4px inputs, yellow focus ring, and a full-width solid Rosso uppercase "ĐĂNG NHẬP" CTA. Error alert (if shown) uses warning red.

- [ ] **Step 8: Commit**

```bash
git add src/screens/login.tsx
git commit -m "feat(login): dark cinematic hero + light editorial form"
```

---

## Task 12: Dashboard — tokenize inline colors

**Files:**
- Modify: `src/screens/dashboard.tsx:47,59-61`.

- [ ] **Step 1: Stat-card icon plate uses Rosso accent sharply** (`src/screens/dashboard.tsx:47`)

Change the icon plate from `rounded-lg bg-primary/10 text-primary` to keep the Rosso tint but sharp:

```tsx
          <div className="size-8 rounded-none bg-primary/15 text-primary grid place-items-center">
```

- [ ] **Step 2: Replace the inline `oklch` up-delta color with a token** (`src/screens/dashboard.tsx:59-61`)

Change the delta span class expression from:

```tsx
                deltaKind === 'up'
                  ? 'text-xs font-medium text-[oklch(0.55_0.18_145)]'
                  : 'text-xs font-medium text-destructive'
```

to:

```tsx
                deltaKind === 'up'
                  ? 'text-xs font-medium text-success'
                  : 'text-xs font-medium text-destructive'
```

- [ ] **Step 3: Verify build + lint**

Run: `pnpm build && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Visual check**

`pnpm dev` → `/dashboard`. Expected: stat cards dark-elevated with sharp Rosso-tinted icon plates; no raw `oklch` literals; deltas use success/destructive tokens.

- [ ] **Step 5: Commit**

```bash
git add src/screens/dashboard.tsx
git commit -m "feat(dashboard): tokenize colors, sharp Rosso accents"
```

---

## Task 13: Full-app visual sweep + final verification

**Files:** none expected; spot-fix only what the sweep reveals.

- [ ] **Step 1: Full build + lint**

Run: `pnpm build && pnpm lint`
Expected: both PASS clean.

- [ ] **Step 2: Walk every screen on `pnpm dev`**

Visit each route and confirm dark chrome + light data bands, no contrast failures, no leftover blue/rounded artifacts:
`/login`, `/dashboard`, `/departments`, `/employees`, `/attendances`, `/salary-periods`, `/payroll-runs`, `/reports`, `/products`, `/operations`, `/rates`, `/accounts`, `/roles`, `/audit-logs`, `/forbidden`.

For each: page heading is weight-500 display; tables sit in white bands with uppercase heads; buttons are uppercase sharp (primary solid Rosso, destructive red-outline); badges are uppercase pills; focus rings yellow.

- [ ] **Step 3: Grep for leftover hardcoded styling that should be tokens**

Run:
```bash
grep -rn "oklch(" src/screens src/components 2>/dev/null; grep -rn "rounded-lg\|rounded-xl\|rounded-md" src/screens src/components/layout 2>/dev/null
```
Expected: review each hit. Tokenize any stray `oklch(` brand color and sharpen any chrome `rounded-*` that should be `rounded-none`. (Form-input `rounded-[4px]` and badge `rounded-full` are intentional and OK.) Fix inline, commit if changed:

```bash
git add -A && git commit -m "fix: tokenize/sharpen stray styles from visual sweep"
```

- [ ] **Step 4: Confirm the modified `roles.tsx` (pre-existing change) still builds**

`roles.tsx` had uncommitted edits at branch start. Confirm it renders and builds. If it carries hardcoded colors, tokenize per the same rules.

- [ ] **Step 5: Final commit + summary**

Confirm `git status` is clean and `pnpm build && pnpm lint` pass. The branch `feat/ferrari-design-refactor` is ready for review/merge (see superpowers:finishing-a-development-branch).

---

## Self-review (completed by plan author)

- **Spec coverage:** tokens (T1), radius (T1), typography/buttons (T2,T10), card/elevation (T3), badge (T4), forms (T5), table (T6), modals band-light (T7), data-table band-light (T8), chrome dark + Rosso-scarce (T9), login hero (T11), dashboard (T12), destructive-outline decision (T2,T7), full sweep across 15 screens (T13). All spec sections map to a task.
- **Placeholder scan:** none — every code step shows the exact string/diff.
- **Type consistency:** no new types/signatures introduced; only className strings and one prop change (`AlertDialogAction variant`), which already exists on the component.

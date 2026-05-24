# Ferrari Design-Language Refactor — Design Spec

**Date:** 2026-05-24
**Status:** Approved (design), pending implementation plan
**Source brief:** `DESIGN.md` (Ferrari-design-analysis design system)

## Goal

Apply the Ferrari luxury-automotive **design language** from `DESIGN.md` to the existing TA-HR admin app. Not a literal port of Ferrari's marketing components (hero photos, F1 driver cards, preowned listings) — those are irrelevant to an HR tool. We adopt the design *language*: near-black canvas, Rosso Corsa accent, sharp corners, Inter (FerrariSans substitute) typography, the 8px spacing ladder, hairline-and-brightness elevation.

## Decisions (from brainstorming)

1. **Canvas:** Dark chrome + light data bands (hybrid). Chrome (sidebar, topbar, cards, dashboard) renders on the near-black canvas; data tables and forms render as white editorial bands — mirroring Ferrari's preowned/pricing surfaces.
2. **Depth:** Tokens + components + screens (deepest scope).
3. **Two-reds problem:** Primary = solid Rosso fill. Destructive = red outline (transparent fill + Rosso border/text). Clean separation, on-brand sharp-outline look.

## Current state

- **Tailwind v4**, CSS-first `@theme` in `src/index.css`. No `tailwind.config.js`.
- **shadcn** (new-york, neutral base, oklch CSS vars). `@custom-variant dark (&:is(.dark *))` declared but `.dark` is never applied — app is light-only today.
- Light theme, blue primary (`oklch(0.5635 0.2408 260)`), `--radius` 10px (rounded), Inter 400/500/600/700 already loaded via Google Fonts in `index.html`.
- 21 UI primitives in `src/components/ui/`, 15 screens in `src/screens/`, shell in `src/components/layout/`.
- **Shared primitives** — all 15 screens compose `PageHeader`, `DataTable`, `Card`, `Badge`, `Button`, and dialogs from `ui/`. Restyling these + tokens propagates to every screen with minimal per-screen edits. This is the core leverage of the refactor.

## Architecture

### Mechanical approach: dark default, light band opt-in

Make Ferrari near-black the **global default** in `@theme`. Add a single `.band-light` class that re-declares the color tokens (`--color-background`, `--color-card`, `--color-foreground`, `--color-muted-foreground`, `--color-border`, `--color-input`, etc.) to the white editorial values. Any subtree wrapped in `.band-light` flips to light; everything else inherits dark.

- Chrome (sidebar, topbar, cards, dashboard) renders dark with zero per-element work.
- Data surfaces wrap in `.band-light`: push the class into the shared `DataTable` and `Dialog`/`Sheet` content so screens need near-zero changes.

Rejected alternative — *light default + dark-chrome patches*: inverts the token story, needs more per-element overrides, fights the dark-first intent of `DESIGN.md`.

### Token map (`src/index.css`)

| Token | Dark default | `.band-light` |
|---|---|---|
| `--color-background` (canvas) | `#181818` | `#ffffff` |
| `--color-card` / `--color-popover` (elevated) | `#303030` | `#f7f7f7` |
| `--color-foreground` / `*-foreground` (ink) | `#ffffff` | `#181818` |
| `--color-muted` | `#303030` | `#ebebeb` |
| `--color-muted-foreground` (body) | `#969696` | `#666666` |
| `--color-secondary` / `--color-accent` | `#303030` | `#ebebeb` |
| `--color-border` / `--color-input` (hairline) | `#303030` | `#d2d2d2` |
| `--color-primary` (Rosso Corsa) | `#da291c` | `#da291c` |
| `--color-primary-foreground` | `#ffffff` | `#ffffff` |
| `--color-ring` (focus, Hypersail yellow) | `#fff200` | `#fff200` |
| `--color-destructive` | `#da291c` | `#da291c` |
| `--color-success` | `#03904a` | `#03904a` |
| `--color-warning` | `#f13a2c` | `#f13a2c` |
| `--color-sidebar*` | dark canvas/elevated set | (chrome stays dark) |

Hex kept for fidelity to `DESIGN.md` (oklch conversion optional, not required).

### Radius

Zero the radius scale → sharp by default:
- `--radius-sm/md/lg/xl` → `0` (sharp corners on buttons, cards, dialogs — the brand signature).
- `--radius-full` (`9999px`) unchanged — badges only.
- **Override** `Input`, `Textarea`, `Select` trigger to `rounded-[4px]` (DESIGN.md `rounded.sm`).

### Typography

- Inter (already loaded) is the documented FerrariSans substitute. Display weight 500, body 400, no bold display.
- **Display/headings** (`PageHeader` h2, `Topbar` h1): negative letter-spacing via `tracking-tight`, weight 500.
- **Buttons**: `uppercase tracking-[0.1em]` (≈1.4px on 14px) on `default` / `secondary` / `outline` / `destructive`. `ghost` and `link` stay normal-case (icon-only and utility buttons).
- **Badges**: uppercase, 11px, `tracking-wide`, full pill.
- **Nav group labels**: already uppercase/tracked — keep. Nav item labels stay normal-case for Vietnamese legibility.
- Vietnamese diacritics uppercase cleanly; no special handling needed.

## Components to restyle (shared primitives)

| Primitive | Change |
|---|---|
| `Button` | uppercase + `tracking-[0.1em]` + sharp corners on filled/outline variants; **destructive → outline treatment** (transparent fill, Rosso border + text). |
| `Card` | sharp corners, dark elevated `#303030`, 1px hairline border, drop shadows removed (brightness-step elevation only). |
| `Badge` | uppercase, 11px, full pill, elevated/hairline backgrounds. |
| `Input` / `Textarea` / `Select` | `4px` corners, hairline border; inherit band context. |
| `DataTable` | wrap in `.band-light` → white editorial table band. |
| `Dialog` / `Sheet` | content wrapped in `.band-light` → forms render as light bands. Sharp corners. |
| `Table` | hairline row dividers, light-band text colors. |
| `PageHeader` / `Topbar` | display typography, negative tracking. |
| `Sidebar` / `Topbar` chrome | inherit dark canvas; active nav item = Rosso or elevated; logo plate Rosso. |

## Screens

Shared primitives cover the 15 screens automatically. Per-screen work is limited to:

- **Login** (`login.tsx`): full-bleed dark cinematic hero treatment, single solid Rosso CTA, sharp inputs.
- **Dashboard** (`dashboard.tsx`): dark header band; stat cards dark-elevated with Rosso icon accents; recent-activity card stays dark.
- **Data screens** (employees, departments, accounts, roles, attendances, salary-periods, payroll-runs, rates, products, operations, reports, audit-logs): inherit via `DataTable` + `Dialog` band-light; spot-fix any hardcoded colors (e.g. dashboard's inline `oklch` delta colors → tokens).

### Spacing / editorial pacing

Honor the 8px token ladder (4/8/16/24/32/48/64/96/128). Apply at **admin-appropriate** steps — NOT literal 96px marketing bands everywhere (would waste data density). Page header bottom margin, section gaps, and card padding align to the ladder.

## Elevation

No drop-shadow tiers. Elevation = brightness step (`#181818` canvas → `#303030` card) + 1px hairline borders. Remove `shadow-sm` / `shadow-xs` from Card and Button.

## Error handling / states

- Focus ring: Hypersail yellow `#fff200` (`--color-ring`) — distinctive, on-brand.
- Validation: `--color-warning` `#f13a2c`; success `#03904a`.
- Destructive confirm dialogs (`confirm-dialog.tsx`, `alert-dialog.tsx`): destructive action uses the outline-red treatment.

## Out of scope

- Animation timings (hero parallax, counters) — `DESIGN.md` Known Gaps.
- Literal Ferrari marketing components (F1 driver cards, preowned listings, livery bands, spec cells).
- New screens or features. Visual refactor only — no behavior/data changes.
- `CLAUDE.md` is stale ("starter template"); updating it is a separate concern, not part of this refactor.

## Success criteria

- `pnpm build` and `pnpm lint` pass clean.
- App renders dark chrome + white data bands throughout, no light-on-light or dark-on-dark contrast failures.
- Primary CTAs solid Rosso; destructive actions red-outline; no two-reds confusion.
- All buttons/cards/dialogs sharp-cornered; inputs 4px; badges pill.
- Focus ring yellow; no residual blue primary or rounded `--radius` 10px artifacts.
- Visual consistency across all 15 screens with no per-screen color hardcoding left behind.

---
name: update-specs-tracking
description: (dokidoki) Use when the repo's README Specs Tracking table is stale, missing, or the README lacks the canonical 3-section structure. Scans docs/superpowers/specs/ and per-spec STATUS.md to rebuild the table; normalizes the README skeleton per the Shared rules appendix below. Triggered by AGENTS.md rules at Plan Creation and Plan Completion.
---

# /update-specs-tracking

Keeps `README.md`'s Specs Tracking table and 3-section skeleton in sync with `docs/superpowers/specs/` and per-spec `STATUS.md` files.

## Preconditions

- Invoked from the repo root inside a git worktree.
- Read the **Shared rules** section at the end of this file before doing anything. Every rule there applies to this skill.

## Procedure

### 1. Normalize the skeleton

Apply the Shared rules §3 (normalization procedure) in full. If the title or tagline is missing, halt and prompt the user; do not proceed until supplied.

### 2. Discover specs

List `docs/superpowers/specs/*.md`. If the folder does not exist or is empty, render the table with a single empty-state row and skip to step 7:

```
| Date | Title | Status | Goal | Spec | Plan |
|------|-------|--------|------|------|------|
| _No specs yet_ | | | | | |
```

### 3. Per spec, extract fields

For each `docs/superpowers/specs/<filename>.md`:

| Field | Source |
|---|---|
| Date | Filename prefix `YYYY-MM-DD-<slug>.md`. If the filename does not match this pattern, skip the spec and warn at the end. |
| Slug | The `<slug>` part (everything after `YYYY-MM-DD-` and before `.md`). |
| Title | The H1 of the spec file, with any of these suffixes stripped: `— Design Specification`, `— Design Spec`, `— Spec`. If the stripped result is longer than 40 characters, leave it unchanged and flag it to the user at the end. If the spec has no H1, ask the user for a title. |
| Status | Derived from `docs/superpowers/plans/<date>-<slug>/STATUS.md` — see §4 below. |
| Goal | **Existing rows:** keep the current Goal cell text verbatim (the skill never rewrites existing Goal cells). **New rows (spec not previously in the table):** read spec §1/§2, draft a one-sentence goal, show the user, get approval, insert. |
| Spec link | `[spec](docs/superpowers/specs/<filename>)`. |
| Plan link | `[plans](docs/superpowers/plans/<date>-<slug>/STATUS.md)` if the folder exists; `_(TBD)_` otherwise. |

### 4. Status derivation from STATUS.md

Match is **case-insensitive** and **prefix-based** — a row beginning with `In progress — Tasks 1–3 verified on hardware…` matches `In progress`, and `Complete (v0.1.0, 2026-04-15)` matches `Complete`.

| Condition | Resulting Status |
|---|---|
| Plans folder `docs/superpowers/plans/<date>-<slug>/` does not exist | `Draft` |
| Folder exists, every Status row in STATUS.md starts with `Not started` | `Planned` |
| Any row starts with `In progress` | `In Progress` |
| Every row starts with `Complete` | `Complete` |
| `STATUS.md` missing or malformed (no recognizable table or no rows) | `Draft`, flag to user at end |

### 5. Row matching and deletions

Match existing rows in the README's Specs Tracking table to specs on disk by the **Spec link path**. That path is unique per spec.

- **Same path on disk and in table:** update in place. Preserve Goal. Recompute Date, Title, Status, Plan link.
- **New path on disk, not in table:** add a new row. Ask the user to confirm the drafted Goal.
- **Path in table but not on disk:** ask the user with `[remove / keep / restore file]`. Never silently delete. If the user picks `restore file`, halt and tell the user to restore the spec file first, then re-run.

### 6. Sort and render

Sort ascending by Date (oldest first). For ties, sort stably by filename.

Render the table with header:

```
| Date | Title | Status | Goal | Spec | Plan |
|------|-------|--------|------|------|------|
```

Below the table, emit the legend:

```
**Status values:** `Draft` → `Planned` → `In Progress` → `Complete`.
```

### 7. Intro paragraph

- If `## Specs Tracking` already has an intro paragraph (prose between the heading and the table), **preserve it verbatim**.
- If not, insert this canonical one:

> Living index of design specs and their implementation plans. Each row links to the detailed spec under `docs/superpowers/specs/` and to the corresponding plan folder's `STATUS.md` under `docs/superpowers/plans/`.

### 8. Diff and commit

- Show the user the computed diff (proposed `README.md` vs. current).
- Require explicit approval before writing.
- If nothing changed (skeleton already correct, table in sync), report `already up to date` and exit without committing.
- Otherwise write the file and commit with message:

```
docs(readme): refresh specs tracking table
```

Never push. Never tag.

## Edge cases

- Spec with no H1 → ask user for a title.
- Filename not matching `YYYY-MM-DD-<slug>.md` → skip with warning.
- STATUS.md references plan files that do not exist on disk → still use STATUS.md's row statuses for derivation; flag the orphaned plan references to the user at the end.
- Multiple specs with the same date → sort stably by filename.
- The `## Specs Tracking` body has content that is neither the intro paragraph nor a table → treat it as stray content and append-migrate it into `## User Guide` per the Shared rules §4 (this preserves anything a user manually added).

## Shared rules

Both `/update-specs-tracking` and `/update-project-brief` apply the rules in this appendix at the start of every run, before their own procedure.

### 1. Canonical README skeleton

Every repo's root `README.md` has exactly this shape:

```
# <Repo Title>
<tagline — one line, mandatory>

## Table of Contents
- [Specs Tracking](#specs-tracking)
- [Project Brief](#project-brief)
- [User Guide](#user-guide)

## Specs Tracking
<body owned by /update-specs-tracking>

## Project Brief
<body owned by /update-project-brief>

## User Guide
<body not owned by either skill; stray content migrated here as H3>
```

### 2. Section ownership

| Region | Owner | Rule |
|---|---|---|
| Title line | neither | Never touched. If missing, halt and ask user. |
| Tagline | neither | Never touched. If missing, halt and ask user. |
| Table of Contents | both | Regenerated from section headings on every run. |
| `## Specs Tracking` body | `update-specs-tracking` only | Fully regenerated by its owner. |
| `## Project Brief` body | `update-project-brief` only | Fully regenerated (short pointer form). |
| `## User Guide` body | neither writes directly | Only touched to *append* migrated stray content. |

### 3. Normalization procedure

Every skill runs this procedure first, before its own work.

1. Read `README.md`. If the file does not exist, create it empty.
2. Check the first non-empty line is a level-1 heading (`# …`). If missing, ask the user for the repo title, insert it, continue.
3. Check the next non-empty line is a tagline — plain prose, not another heading. If missing, ask the user for a one-line tagline, insert it, continue.
4. Ensure a `## Table of Contents` block sits between the tagline and the first H2 section heading. Regenerate it on every run with exactly these three entries:

   ```
   ## Table of Contents

   - [Specs Tracking](#specs-tracking)
   - [Project Brief](#project-brief)
   - [User Guide](#user-guide)
   ```

5. Ensure `## Specs Tracking`, `## Project Brief`, `## User Guide` exist in that order below the Table of Contents. If any are missing, insert the heading with an empty body. If present but out of order, reorder them.
6. Apply stray-content migration (§4).

### 4. Stray-content migration into `## User Guide`

- Any H2 heading that is **not** one of the three canonical ones is demoted to H3 and moved to the end of `## User Guide`, preserving its body.
- Any prose appearing between the three canonical sections but not under any of them is moved verbatim to the end of `## User Guide`, preserving surrounding blank lines.
- H3 headings already inside `## User Guide` are preserved in place; their order is never changed.
- Migration is **append-only** — content is relocated, never deleted.

### 5. Safety rules

Both skills obey these at all times:

- Abort if `git rev-parse --is-inside-work-tree` fails (not a git repo).
- Read the file before writing. Never blind-overwrite.
- Show the computed diff to the user and require approval before writing.
- Never modify files outside `README.md` and `PROJECT-BRIEF.md`.
- Never create, switch, merge, push, or tag branches.
- If `README.md` or `PROJECT-BRIEF.md` has uncommitted changes on invocation, show the current diff first and ask the user: (a) stash and proceed, (b) proceed and stack on top, or (c) abort.
- Commit behavior: exactly one commit per skill invocation, zero if nothing changed. Do not push. Do not tag.

### 6. What "already up to date" means

A skill exits without committing and reports `already up to date` when all of the following are true:

- The README skeleton is already correct (no normalization edits needed).
- The skill's own managed section has no content change.
- No files are in a state that requires user attention (e.g., deleted-spec prompt, missing footer prompt).

If any of these require a change, the skill proposes the diff and commits on approval.

---
name: update-project-brief
description: (dokidoki) Use when PROJECT-BRIEF.md is missing, stale, or the README's Project Brief section is out of sync. Bootstraps the brief from repo context if absent; otherwise updates it from specs newer than the brief's Last updated footer. Updates the README pointer. Triggered by AGENTS.md rules at Plan Creation and Plan Completion.
---

# /update-project-brief

Creates `PROJECT-BRIEF.md` if missing (Mode A) or refreshes it from specs newer than its `Last updated` footer (Mode B). Regenerates the README's Project Brief pointer in both modes.

## Preconditions

- Invoked from the repo root inside a git worktree.
- Read the **Shared rules** section at the end of this file before doing anything. Every rule there applies to this skill.

## Mode detection

- **Mode A — Bootstrap** if `PROJECT-BRIEF.md` does not exist at the repo root.
- **Mode B — Update** if it exists.

## Mode A: Bootstrap

### A.1 Normalize README

Apply the Shared rules §3 in full.

### A.2 Gather context

Read the following from the repo root (all optional; use what's present):

- `README.md` (especially User Guide subsections that hint at architecture/services)
- `AGENTS.md` (safety rules, project description, editable configs, conventions)
- `AGENTS.md` (non-Codex agent rules)
- `docker-compose.yml` (service list, ports, images)
- `package.json` / `pyproject.toml` / etc. (language/runtime hints)
- Top-level folder names (`firmware/`, `grafana/`, `nodered/`, `scripts/`, …)
- Existing specs in `docs/superpowers/specs/` (if any)
- Project name from `git remote -v` (last path segment) or the working directory name

### A.3 Draft a freestyle brief

There is no rigid template. Write whatever sections fit the repo, aimed at **high-level orientation for future `/brainstorming` sessions**.

Common sections you may use when they apply (pick and adapt — not a checklist):

- What the repo is (one paragraph, domain + purpose)
- Who uses it (personas)
- Domain vocabulary (nouns, terms, conventions)
- Architecture at a glance (services, data flow)
- Repository layout
- Environment & deployment
- Current state & roadmap
- Where to go next (pointers to AGENTS.md, specs, plans)

Aim for orientation, not exhaustive documentation. The AGENTS.md and specs already hold rules and detail; the brief is the map.

### A.4 Identify gaps

Wherever you can't infer something confidently (e.g. owning team, external stakeholders, personas, business scope), insert `**TBD:** <what's missing>` inline. Collect the list to show the user in step A.5.

### A.5 Review with user

Present the draft alongside the `TBD:` list. The user either fills each TBD or confirms they're acceptable as-is.

### A.6 Append footer

Append at the very bottom of the brief (today's date from the environment, not hardcoded):

```
> Last updated: YYYY-MM-DD
```

### A.7 Regenerate README pointer

Under the README's `## Project Brief` heading, write exactly:

```
See [`PROJECT-BRIEF.md`](./PROJECT-BRIEF.md) — <first-section one-liner>.
```

Where `<first-section one-liner>` is the first sentence of the brief's opening section.

### A.8 Diff and commit

- Show the user the combined diff (new `PROJECT-BRIEF.md` + changes to `README.md`).
- Require approval before writing.
- Commit with message:

```
docs: bootstrap PROJECT-BRIEF.md
```

## Mode B: Update

### B.1 Normalize README

Apply the Shared rules §3 in full.

### B.2 Read the footer

Look for a line at the bottom of `PROJECT-BRIEF.md` matching (tolerant of a leading `>` blockquote prefix and whitespace):

```
> Last updated: YYYY-MM-DD
```

- If found, take that date as the reference date.
- If missing, run `git log -1 --format=%cs -- PROJECT-BRIEF.md` and ask the user whether to adopt the resulting date as the reference. If the user **declines**, ask them for a reference date explicitly (`YYYY-MM-DD`); if they decline that too, abort the run with a message that the brief must have a `> Last updated:` footer to enable incremental updates. The footer itself is appended/bumped in step B.6 — no separate append is needed here.
- If the footer date is in the future (clock skew or manual edit), warn the user and ask whether to proceed using today's date.

### B.3 Find new specs

List `docs/superpowers/specs/*.md` where the filename date prefix `YYYY-MM-DD` is **strictly after** the reference date. Only these specs are read — older specs and the brief itself are the source of truth for pre-reference context.

If there are zero new specs, jump to B.6.

### B.4 Propose updates

For each new spec, read it in full and draft concrete suggestions:

- Which section of the brief to touch (or a new section to add), and
- What text to insert/edit (a few sentences, the high-level signal — not spec detail).

Present each suggestion compactly, e.g.:

```
Spec 2026-04-20-local-docker-dev-design.md
  → §5 Architecture: add note that docker-compose.yml now supports local Firestore emulator.
  → §8 Current state & roadmap: add "local Firestore emulator wiring (planned)".
```

### B.5 User picks

For each suggestion, the user picks `accept`, `edit`, or `skip`. Apply the accepted ones to `PROJECT-BRIEF.md`.

### B.6 Bump footer

Ensure the `> Last updated:` footer is present with today's date. If the footer is already today's date and no changes were applied in B.5, this is a no-op and contributes no diff (see B.8 "already up to date").

### B.7 Regenerate README pointer if needed

If the brief's opening one-liner changed, regenerate the pointer line under the README's `## Project Brief` heading (same format as Mode A step A.7).

### B.8 Diff and commit

- Show the user the diff.
- Require approval.
- Commit messages:

| Situation | Message |
|---|---|
| Changes applied to the brief | `docs: refresh PROJECT-BRIEF.md from <N> new spec(s)` |
| All suggestions declined; footer bumped | `docs: re-date PROJECT-BRIEF.md footer; no content changes from <N> reviewed spec(s)` |
| No new specs *and* footer already today | No commit. Report `already up to date`. |

Never push. Never tag.

## Edge cases

- No specs at all → Mode A emits a short brief focused on what can be inferred from `README.md` and `AGENTS.md`. Mode B only touches the footer (if needed) and the README pointer.
- Brief manually edited after the footer date (detected via `git log -1 --format=%cs -- PROJECT-BRIEF.md` showing a commit newer than the footer) → proceed, but warn the user so they're not surprised if the skill's edits adjust their wording.
- Project name cannot be inferred in Mode A → ask the user.
- README's `## Project Brief` heading missing → the Shared rules §3 step 5 creates it with an empty body; the skill then fills in the pointer line.

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

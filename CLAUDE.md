# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (see `pnpm-lock.yaml`).

- `pnpm dev` — Vite dev server with HMR
- `pnpm build` — Type-check (`tsc -b`) then production build (`vite build`)
- `pnpm lint` — ESLint over repo
- `pnpm preview` — Serve built `dist/`

No test runner is configured.

## Architecture

Vanilla Vite + React 19 + TypeScript starter template, currently unmodified from scaffold:

- Entry: `src/main.tsx` mounts `<App />` into `#root` (defined in `index.html`).
- `src/App.tsx` is the sole component — landing page placeholder.
- Static SVG sprite at `public/icons.svg`, referenced via `<use href="/icons.svg#id">`.
- TS config split: `tsconfig.app.json` (src, DOM, bundler resolution, `verbatimModuleSyntax`, `noUnusedLocals/Parameters`) + `tsconfig.node.json` (Vite config). Root `tsconfig.json` is a project-references shim.
- ESLint flat config (`eslint.config.js`) with `typescript-eslint`, `react-hooks`, `react-refresh` (Vite preset). No type-aware rules enabled yet.

## Notes

- React 19 + Vite 8 + TS 6. Use `react-jsx` runtime (no `import React` needed).
- `verbatimModuleSyntax` on: type-only imports must use `import type`.

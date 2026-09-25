# 0002 — Monorepo

- **Status:** accepted (2026-09-25)
- **Context:** Many small, short-lived products. Lessons from one project must improve all future
  ones, and killing a project must be clean.

## Decision

One private GitHub monorepo with **pnpm workspaces + Turborepo** (local cache only; no remote
cache, no accounts):

- `apps/<slug>` per project, `packages/*` for shared code, `templates/next-app` as the canonical
  app, `tools/` for the scaffolder and checks, `docs/` and `.claude/` for the harness.
- Projects are independent at runtime (own Vercel project, domain, Supabase project) but share
  rules, tooling and code at build time.
- Code moves into a package only when a second app needs it (rule of two).
- pnpm's strict, isolated `node_modules`: a package can only import what it declares.
- Turborepo `--affected` limits CI to changed packages and their dependents; `turbo-ignore`
  does the same for Vercel builds.

## Why not separate repos

Harness improvements (lint rules, skills, template fixes, CI) would have to be copied into every
repo and would drift. One repo means one fix reaches every project, and one agent session can
see the whole factory.

## Consequences

- Changes to `packages/*` must keep every app green; CI checks all dependents.
- Killing a project is one PR that deletes `apps/<slug>` (plus external resources by hand).
- The template must stay a working workspace member so it never silently rots.

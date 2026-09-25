# Project Factory

A monorepo that launches many small products fast, then keeps or kills each one based on real
adoption data. One shared harness and shared packages; one folder per project under `apps/`.
Every project and its status: [docs/portfolio.md](docs/portfolio.md).

## Commands

| Command                                               | What it does                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm check`                                          | lint + typecheck + unit tests everywhere, then repo checks (RLS etc.) |
| `pnpm check:affected`                                 | same, only for packages changed vs `origin/main` (what PR CI runs)    |
| `pnpm new-project <slug>`                             | scaffold `apps/<slug>` from the template (use the new-project skill)  |
| `pnpm --filter <slug> dev`                            | run one app locally                                                   |
| `pnpm turbo run build test:e2e --filter @apps/<slug>` | build + Playwright smoke test for one app                             |
| `pnpm format`                                         | Prettier                                                              |

## Structure

- `apps/<slug>/` — one Next.js app per project. Isolated at runtime (own Vercel, Supabase, domain).
- `packages/config/` — shared tsconfig, ESLint (incl. dependency rules), Prettier.
- `packages/ui/` — shadcn/ui components + Tailwind theme. `packages/analytics/` — PostHog + typed `track()`.
- `packages/supabase/` — created by the add-backend skill on first need.
- `templates/next-app/` — the canonical app the scaffolder copies. Builds and tests in CI.
- `tools/` — scaffolder, repo checks (`tools/checks/`), agent guard hook (`tools/hooks/`).
- `docs/` — architecture, principles, analytics, portfolio, briefs, decisions, exec plans.
- `.claude/` — agent settings (permissions, hooks) and skills.

## Dependency rules (enforced by ESLint; read the error message, it names the fix)

- Apps import from `packages/*`. Packages never import from apps. Apps never import other apps.
- Client components (`"use client"`) never import `src/server/` or `@factory/*/server`.
  Every file in `src/server/` starts with `import "server-only";`.
- Every import must be declared in that package's own `package.json` (pnpm is strict).
- **Rule of two:** code lives in its app until a second app needs it; then move it to a package
  (promote-to-package skill). Don't pre-build shared abstractions.

## Non-negotiables

- Run checks for everything you touched before declaring a task done (`pnpm check:affected`,
  plus `test:e2e` for apps whose UI changed).
- Never read, print, or commit secrets or `.env` files. Only `.env.example` is readable. New
  variables go in `.env.example` and `src/env.ts`; tell the human what to set and where.
- Never push to `main`. Work on a branch; open a PR with `gh pr create`. Never merge PRs.
- Every new table has RLS enabled with explicit policies. Never disable RLS.
- Validate all external input with Zod (forms, route handlers, server actions, env, external APIs).
- Every user-facing feature emits the analytics events defined in its app's brief.
- One feature per PR; one app per PR unless changing a shared package.
- Changes to `packages/*` must keep every app passing.
- Never disable, skip, or weaken a test or lint rule to make a check pass. Fix the cause.
- No new services, SaaS, or paid dependencies without asking the human first.

## Workflow

1. Read the app's `AGENTS.md` and its brief in `docs/briefs/` before feature work.
2. For any task longer than about an hour, write a plan at
   `docs/exec-plans/active/<slug>-<task>.md` (goal, steps, acceptance criteria, progress log).
   Update it as you go; move it to `docs/exec-plans/completed/` when the PR merges.
3. Branch → implement → tests → analytics events → `pnpm check:affected` → PR (use the template).
4. When you get something wrong, log it (log-harness-lesson skill) so the harness improves.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, what goes where, isolation, data flow.
- [docs/golden-principles.md](docs/golden-principles.md) — errors, naming, logging, components, design.
- [docs/analytics.md](docs/analytics.md) — event naming, required properties, events per app.
- [docs/briefs/](docs/briefs/) — one brief per project; `TEMPLATE.md` for new ones.
- [docs/decisions/](docs/decisions/) — why the stack and monorepo look the way they do.
- [docs/harness-log.md](docs/harness-log.md) — agent mistakes and the harness fixes they led to.

## Skills (`.claude/skills/`)

`new-project` · `add-feature` · `add-analytics-event` · `add-backend` · `add-db-table` ·
`promote-to-package` · `kill-project` · `fix-failing-check` · `log-harness-lesson`

## Guardrails you will hit

- `.claude/settings.json` denies reading `.env*` files, pushing to `main`, force pushes,
  `gh pr merge`, `rm -rf` outside the repo, and Supabase commands against remote projects.
  `tools/hooks/guard-bash.ts` enforces the same for command variants. Don't work around them.
- The `import-x/no-extraneous-dependencies` message says "npm i <pkg>"; in this repo run
  `pnpm --filter <package> add <pkg>` instead (and ask first if it's a new service).

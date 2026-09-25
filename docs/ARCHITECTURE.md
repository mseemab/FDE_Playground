# Architecture

## Layers

```
apps/<slug>          one product each: routes, features, its own backend (optional)
   │ imports
   ▼
packages/*           shared code: ui, analytics, config, supabase (on first need)
   │ imports
   ▼
npm dependencies     declared in each package.json (pnpm strict resolution)
```

Imports only flow downward. `templates/next-app` sits at the app layer: it is a real app named
`template-next-app` that builds and tests in CI, and `pnpm new-project` copies it.
`tools/` holds build-time tooling (scaffolder, repo checks, agent hooks) and is never imported
by apps or packages.

## What goes where

| You are adding…                              | Put it in                                            |
| -------------------------------------------- | ---------------------------------------------------- |
| A page or route                              | `apps/<slug>/src/app/`                               |
| A component used by one app                  | `apps/<slug>/src/components/`                        |
| Server-only logic (DB, secrets, 3rd parties) | `apps/<slug>/src/server/` (imports `server-only`)    |
| Schemas and pure helpers (client + server)   | `apps/<slug>/src/lib/`                               |
| A server action                              | `apps/<slug>/src/app/**/actions.ts` (`"use server"`) |
| An env var                                   | `apps/<slug>/src/env.ts` + `.env.example`            |
| An analytics event                           | brief → `src/analytics.ts` → `docs/analytics.md`     |
| A migration                                  | `apps/<slug>/supabase/migrations/`                   |
| Code a second app now needs                  | a package under `packages/` (promote-to-package)     |
| A UI primitive every app should get          | `packages/ui/src/components/`                        |

## Runtime isolation

Apps share code at build time only. At runtime each app has its **own** Vercel project (root
directory `apps/<slug>`), domain, Supabase project (if any) and env vars. Killing an app means
deleting its folder and its external resources; nothing else breaks. The one shared runtime
service is PostHog: one project for all apps, separated by the `app` property on every event.

## Dependency rules

Enforced by ESLint (`packages/config/eslint`) and pnpm:

- `factory/no-cross-workspace-imports`: no app → app imports, no package → app imports, no
  relative paths into another workspace member.
- `factory/no-server-import-in-client`: `"use client"` files can't import `src/server/`,
  `server-only` or `@factory/*/server`.
- `factory/require-server-only`: files in `src/server/` must import `server-only`.
- `import-x/no-extraneous-dependencies` + pnpm strict mode: every import is declared.

## Data flow (typical app)

```
Browser ──form/action──▶ Server action (Zod-validate input)
                             │
                             ├─▶ src/server/* ──▶ Supabase (RLS enforces per-user access)
                             │
                             └─▶ returns typed state ──▶ client component ──▶ track(event)
                                                                                 │
                                                          PostHog (event + app: "<slug>")
```

- All external input is validated with Zod at the boundary (forms, route handlers, server
  actions, env vars, external API responses).
- Auth (when an app has a backend): Supabase Auth with Google only, via `packages/supabase`.
  Row Level Security is the access-control layer; application code never bypasses it with the
  service-role key for user data.

## Quality gates

`pnpm check` locally; CI runs `check:affected`, build and Playwright smoke tests for affected
apps on every PR, and the full check on `main`. `tools/checks/` adds repo-level checks: RLS on
every table, AGENTS.md/CLAUDE.md shape, and template drift warnings. Vercel skips builds for
apps whose code and dependencies didn't change (`vercel.json` → `turbo-ignore`).

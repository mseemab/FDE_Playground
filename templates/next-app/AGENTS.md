# template-next-app

App-specific context. Factory-wide rules live in the root `AGENTS.md`; read those first.

- **Brief:** [docs/briefs/template-next-app.md](../../docs/briefs/template-next-app.md) — target user,
  core action, events to track, kill criteria. Re-read it before any feature work.
- **Status:** see `docs/portfolio.md`.
- **Run:** `pnpm --filter template-next-app dev` · checks: `pnpm turbo run lint typecheck test --filter @apps/template-next-app`
  · smoke test: `pnpm turbo run test:e2e --filter @apps/template-next-app`

## Layout

- `src/app/` — routes (App Router). Server components by default.
- `src/components/` — app components. Files with `"use client"` must not import `src/server/`.
- `src/server/` — server-only code; every file starts with `import "server-only";`.
- `src/lib/` — code safe for both client and server (schemas, pure helpers).
- `src/env.ts` — Zod-validated env vars. Add new vars here and to `.env.example`.
- `src/analytics.ts` — this app's slug and allowed events. Client code tracks via `@/lib/track`.
- `e2e/` — Playwright smoke test (Chromium). Keep it to the critical path.
- `supabase/` — only if the app has a backend (see the add-backend skill).

## App-specific notes

- Backend: none yet.
- Analytics events: `waitlist_joined`.
- Anything unusual about this app goes here (keep this file ~30 lines).

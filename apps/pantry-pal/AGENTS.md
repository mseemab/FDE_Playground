# pantry-pal

App-specific context. Factory-wide rules live in the root `AGENTS.md`; read those first.

- **Brief:** [docs/briefs/pantry-pal.md](../../docs/briefs/pantry-pal.md) — target user,
  core action, events to track, kill criteria. Re-read it before any feature work.
- **Status:** see `docs/portfolio.md`.
- **Run:** `pnpm --filter pantry-pal dev` · checks: `pnpm turbo run lint typecheck test --filter @apps/pantry-pal`
  · smoke test: `pnpm turbo run test:e2e --filter @apps/pantry-pal`

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

- Backend: Supabase (local: `pnpm --filter pantry-pal db:start`; types: `types:gen`).
  Table `pantry_items` (owner-only RLS, no deletes; items are marked used/discarded).
- Auth: Google only. `/pantry` is protected by `src/proxy.ts`; use `requireUser()` in pages/actions.
- DB tests (stack running): `test:db` (RLS) and `test:e2e:db` (signed-in browser flow).
- Analytics: all brief events registered; item events are captured server-side in actions.

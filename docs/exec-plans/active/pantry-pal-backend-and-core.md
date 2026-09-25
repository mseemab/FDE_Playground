# pantry-pal: backend + core feature

## Goal

Give pantry-pal a Supabase backend with Google sign-in and ship the core loop from the brief:
add an item in under 10 seconds, see what expires soon, mark items used or tossed, with the
brief's analytics events.

## Steps

1. `packages/supabase` (first backend in the factory): browser/server clients, proxy session
   refresh, OAuth callback handler, `getUser()` via verified `getClaims()`; unit tests.
2. `apps/pantry-pal/supabase/`: config (Google provider via env), migration for `pantry_items`
   with RLS + owner-only policies; generated types committed.
3. App wiring: env vars in `src/env.ts` + `.env.example`, `src/proxy.ts`, `/auth/callback`,
   Google sign-in button, sign-out action.
4. `/pantry` page: add-item form (server action + Zod), expiring-soon list, used/tossed actions.
5. Analytics: `user_signed_in`, `item_added`, `item_used`, `item_discarded`,
   `expiring_list_viewed` (server-side where the data lives; client identify with user id).
6. Tests: unit tests for schemas/date logic; RLS integration test against the local stack
   (`test:db`); CI job runs it when an app with a backend is affected.
7. Checks, build, smoke test (unauthenticated pages); human setup steps.

## Acceptance criteria

- [x] Every table has RLS + policies; `pnpm check:rls` passes; RLS test proves user A can't
      read or modify user B's items
- [x] Signed-out users visiting `/pantry` are redirected to `/`
- [x] Add/used/tossed work end to end against the local stack
- [x] All brief events registered and emitted
- [x] `pnpm check`, build and smoke test pass

## Progress log

- 2026-09-25: started. Supabase docs now recommend publishable keys
  (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), `getClaims()` and `proxy.ts` (Next 16); following
  those and updating the add-backend skill to match.
- Note: during the factory setup all work lands on the single setup branch (human's decision)
  instead of one branch per feature.
- 2026-09-25: packages/supabase built (11 tests). Local stack running with a slimmed config
  (Docker Hub rate limits). pantry_items migration + RLS; 7 RLS tests pass, and 6 fail when RLS
  is disabled (verified). Signed-in Playwright flow passes against the local stack. CI `db` job
  added. Real Google sign-in and PostHog delivery need the human's accounts (setup steps given).

---
name: add-backend
description: Give an app a Supabase backend (database + Google sign-in). Use when a brief needs data or logins and the app has no apps/<slug>/supabase folder yet. Creates packages/supabase on first use, local dev setup, Google auth, generated types and .env.example entries.
argument-hint: "<slug>"
---

# Add a backend (Supabase)

One Supabase project per app. Google sign-in only. SQL migrations, generated types, no ORM.
Agents only ever touch the **local** stack; the human creates and links the hosted project.

## Steps

1. **Shared package (first time only).** If `packages/supabase` doesn't exist, create
   `@factory/supabase` with:
   - `.`: `createBrowserSupabase`, `safeRedirectPath`, `matchesPath`
   - `./server` (`import "server-only"`): `createServerSupabase`, `getUser()` (verified
     `getClaims()`, never `getSession()`), `createAuthCallbackHandler`
   - `./proxy`: `updateSession()` for the app's `src/proxy.ts` (Next 16 name for middleware)
     It already exists (created for pantry-pal): reuse it. Don't fork it into the app.
2. **Local Supabase:** add the CLI to the app (`pnpm --filter <slug> add -D supabase@<version used
by other apps>`), then from `apps/<slug>`: `pnpm exec supabase init` (creates `supabase/`).
   Pipe `< /dev/null` into supabase CLI commands run by agents: some (e.g. `migration new`)
   read stdin and hang otherwise. Disable unused services in `config.toml` (analytics, storage,
   realtime, studio, local_smtp, edge_runtime) unless the app needs them.
   In `supabase/config.toml` set the project id to the slug and enable
   `[auth.external.google]` with `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"`
   and `secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"`.
   Keep email sign-up enabled **locally only** so tests can sign in seeded users.
   Add `db:start`, `db:reset` scripts and start it (Docker required; in cloud sessions the
   session hook starts Docker and points the CLI at Docker Hub).
3. **App wiring** (copy from `apps/pantry-pal`): add `@factory/supabase` and
   `@supabase/supabase-js`; add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `src/env.ts` (required on Vercel, defaulting to the
   local stack elsewhere so CI builds without secrets) and `.env.example`; `src/server/supabase.ts`
   (`getSupabase`, `currentUser`, `requireUser`); `src/proxy.ts`; `/auth/callback/route.ts`;
   a Google sign-in button; a sign-out server action.
4. **Types:** add a `types:gen` script:
   `supabase gen types typescript --local > src/lib/database.types.ts`. Commit the output
   (it's types-only, so it lives in `src/lib/`; ESLint ignores this generated file).
5. **First table:** use the add-db-table skill (RLS is mandatory).
6. **Tests:** `test:db` (Vitest RLS tests in `supabase/tests/`) and `test:e2e:db` (signed-in
   Playwright flow in `e2e-db/`, signing in seeded users via `@supabase/ssr`). CI's `db` job runs
   both for affected apps. Keep `e2e/smoke.spec.ts` on unauthenticated pages.
7. **Checks:** `pnpm check:affected`, build, smoke test.
8. **Tell the human** exactly what to do by hand: create the Supabase project, add the Google
   OAuth client (Google Cloud console → Credentials; redirect URI
   `https://<project-ref>.supabase.co/auth/v1/callback`), enable Google in Supabase Auth, set
   the env vars in `.env.local` and Vercel, then link the project and push migrations
   themselves. Agents never run remote Supabase commands.

## Done checklist

- [ ] `packages/supabase` exists (created or reused) with tests
- [ ] `apps/<slug>/supabase/` with config, migrations, RLS on every table
- [ ] Env vars validated in `src/env.ts` and documented in `.env.example`
- [ ] Generated types committed; checks, build and smoke test pass
- [ ] Manual steps handed to the human

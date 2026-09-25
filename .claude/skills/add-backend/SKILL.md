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
   - `src/browser.ts`: `createBrowserClient<Database>(url, anonKey)` factory (`@supabase/ssr`)
   - `src/server.ts` (`import "server-only"`): `createServerClient` using Next's `cookies()`,
     plus `getUser()` and `requireUser()` helpers
   - `src/middleware.ts`: session refresh helper for the app's `src/proxy.ts`
   - unit tests; exports `.`, `./server`, `./middleware`
     If it exists, reuse it. Don't fork it into the app.
2. **Local Supabase:** from `apps/<slug>`: `pnpm dlx supabase init` (creates `supabase/`).
   In `supabase/config.toml` set the project id to the slug and enable
   `[auth.external.google]` with `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"`
   and `secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"`.
   Start it with `pnpm dlx supabase start` (Docker required; in cloud sessions the session hook
   already starts Docker and points the CLI at Docker Hub).
3. **App wiring:** add `@factory/supabase` and `@supabase/supabase-js` to the app; add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `src/env.ts` (required) and
   `.env.example` (with comments saying where to get them); add `src/proxy.ts` for session
   refresh; add `/auth/callback` route handler and a sign-in button using
   `signInWithOAuth({ provider: "google" })`.
4. **Types:** add a `types:gen` script:
   `supabase gen types typescript --local > src/server/database.types.ts`. Commit the output.
5. **First table:** use the add-db-table skill (RLS is mandatory).
6. **Checks:** `pnpm check:affected`, build, smoke test (keep it on unauthenticated pages).
7. **Tell the human** exactly what to do by hand: create the Supabase project, add the Google
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

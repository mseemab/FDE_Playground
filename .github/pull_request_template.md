## What changed

<!-- One or two sentences. One feature per PR. -->

## App(s) or packages

<!-- e.g. apps/pantry-pal, packages/ui. One app per PR unless a shared package changes. -->

## Why

<!-- Link the brief, exec plan (docs/exec-plans/active/...) or issue. -->

## How verified

<!-- Commands run and their result, e.g. `pnpm check:affected`, `pnpm --filter <slug> test:e2e`, manual steps. -->

## Risk areas

<!-- Tick every area this PR touches. Ticked boxes mean a slower, more careful review. -->

- [ ] Auth (sign-in, sessions, route protection)
- [ ] Data (queries, RLS policies, stored user data)
- [ ] Billing
- [ ] Migrations (`apps/*/supabase/migrations/`)
- [ ] Shared packages (`packages/*` — every app must still pass)
- [ ] Agent settings (`.claude/settings.json`, skills, hooks)

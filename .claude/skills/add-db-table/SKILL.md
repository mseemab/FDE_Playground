---
name: add-db-table
description: Add or change a database table in an app's Supabase backend. Use for any new table, column or policy. Writes the migration with RLS and policies, regenerates types and adds a test.
argument-hint: "<slug> <table_name>"
---

# Add a database table

## Steps

1. **Migration:** from `apps/<slug>`: `pnpm exec supabase migration new <verb>_<table> < /dev/null`
   (without `< /dev/null` it waits for SQL on stdin).
   Never edit a migration that has been merged; add a new one.
2. **Write the SQL** with RLS in the same migration:

   ```sql
   create table public.pantry_items (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
     name text not null check (char_length(name) between 1 and 80),
     created_at timestamptz not null default now()
   );
   alter table public.pantry_items enable row level security;
   create policy "pantry_items_select_own" on public.pantry_items
     for select to authenticated using ((select auth.uid()) = user_id);
   create policy "pantry_items_insert_own" on public.pantry_items
     for insert to authenticated with check ((select auth.uid()) = user_id);
   -- add update/delete policies only if the feature needs them
   create index on public.pantry_items (user_id);
   ```

   Rules: plural snake_case names; `user_id` + owner-only policies for user data; explicit
   policies per operation; never disable RLS; never `using (true)` on user data.

3. **Apply locally:** `pnpm --filter <slug> db:reset` (replays all migrations on the local stack).
4. **Regenerate types:** `pnpm --filter <slug> types:gen`; use `Tables<"pantry_items">` in code.
5. **Test:** a unit test for the Zod schema that guards inserts, and RLS tests in
   `supabase/tests/` (`pnpm --filter <slug> test:db`) proving user A can't read, insert as, or
   update user B's rows (see `apps/pantry-pal/supabase/tests/rls.test.ts`).
6. **Checks:** `pnpm check:rls` then `pnpm check:affected`. The PR gets a "risky paths" warning
   comment. Tick "Migrations" and "Data" in the PR template.

## Done checklist

- [ ] Migration enables row level security and has explicit policies for every table
- [ ] `pnpm check:rls` passes; types regenerated and committed
- [ ] Schema test (and RLS test if the stack is available) added
- [ ] Human told the migration must be pushed to the hosted project after merge

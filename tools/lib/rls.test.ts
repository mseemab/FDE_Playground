import { describe, expect, it } from "vitest";
import { checkRls, normalizeTable } from "./rls";

const file = (sql: string, path = "20260101000000_init.sql") => ({ path, sql });

describe("checkRls", () => {
  it("passes a table with RLS enabled and a policy", () => {
    const sql = `
      create table public.pantry_items (id uuid primary key, user_id uuid not null);
      alter table public.pantry_items enable row level security;
      create policy "owners can read" on public.pantry_items for select using (auth.uid() = user_id);
    `;
    expect(checkRls([file(sql)])).toEqual([]);
  });

  it("fails a table without RLS or policies, pointing at the CREATE TABLE line", () => {
    const violations = checkRls([file("-- init\n\nCREATE TABLE items (id int);")]);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ line: 3 });
    expect(violations[0]?.message).toMatch(
      /enable row level security.*and at least one `create policy/,
    );
  });

  it("fails a table with RLS but no policy", () => {
    const sql = "create table items (id int);\nalter table items enable row level security;";
    expect(checkRls([file(sql)])[0]?.message).toMatch(/missing at least one `create policy/);
  });

  it("accepts RLS and policies added in a later migration", () => {
    const a = file("create table if not exists public.items (id int);", "1_a.sql");
    const b = file(
      'alter table only "public"."items" enable row level security;\ncreate policy p on items using (true);',
      "2_b.sql",
    );
    expect(checkRls([a, b])).toEqual([]);
  });

  it("ignores statements inside comments and string literals", () => {
    const sql = `
      create table t (id int);
      -- alter table t enable row level security;
      /* create policy p on t using (true); */
      select 'alter table t enable row level security';
    `;
    expect(checkRls([file(sql)])).toHaveLength(1);
  });

  it("flags disabling RLS", () => {
    expect(
      checkRls([file("alter table public.t disable row level security;")])[0]?.message,
    ).toMatch(/Never disable RLS/);
  });

  it("skips temporary tables and dropped tables", () => {
    expect(checkRls([file("create temporary table scratch (id int);")])).toEqual([]);
    expect(checkRls([file("create table t (id int);\ndrop table if exists t;")])).toEqual([]);
  });
});

describe("normalizeTable", () => {
  it("defaults to the public schema, lowercases unquoted and keeps quoted identifiers", () => {
    expect(normalizeTable("Items")).toBe("public.items");
    expect(normalizeTable('private."Items"')).toBe("private.Items");
  });
});

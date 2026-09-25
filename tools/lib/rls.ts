/**
 * Row Level Security check for Supabase migrations. Every table created in an app's migrations
 * must have RLS enabled and at least one policy, across all of that app's migrations combined.
 * RLS must never be disabled.
 */

export interface MigrationFile {
  path: string;
  sql: string;
}

export interface Violation {
  path: string;
  line: number;
  message: string;
}

interface TableInfo {
  path: string;
  line: number;
  rls: boolean;
  policies: number;
  dropped: boolean;
}

const IDENT = String.raw`(?:"[^"]+"|[A-Za-z_][\w$]*)`;
const QUALIFIED = String.raw`(${IDENT}(?:\s*\.\s*${IDENT})?)`;

const CREATE_TABLE = new RegExp(
  String.raw`\bcreate\s+(?:(temp|temporary)\s+|unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?${QUALIFIED}`,
  "gi",
);
const ENABLE_RLS = new RegExp(
  String.raw`\balter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?${QUALIFIED}\s+enable\s+row\s+level\s+security`,
  "gi",
);
const DISABLE_RLS = new RegExp(
  String.raw`\balter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?${QUALIFIED}\s+disable\s+row\s+level\s+security`,
  "gi",
);
const CREATE_POLICY = new RegExp(
  String.raw`\bcreate\s+policy\s+${IDENT}\s+on\s+${QUALIFIED}`,
  "gi",
);
const DROP_TABLE = new RegExp(String.raw`\bdrop\s+table\s+(?:if\s+exists\s+)?${QUALIFIED}`, "gi");

/** Replaces comments and string literals with spaces, keeping offsets (and line numbers) intact. */
export function stripSql(sql: string): string {
  return sql.replace(/--[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^']|'')*'/g, (match) =>
    match.replace(/[^\n]/g, " "),
  );
}

/** `Public."Items"` → `public.Items`; unqualified names default to the public schema. */
export function normalizeTable(raw: string): string {
  const parts = raw.split(".").map((part) => {
    const trimmed = part.trim();
    return trimmed.startsWith('"') ? trimmed.slice(1, -1) : trimmed.toLowerCase();
  });
  return parts.length === 1 ? `public.${parts[0] ?? ""}` : parts.join(".");
}

function lineAt(sql: string, index: number): number {
  return sql.slice(0, index).split("\n").length;
}

/** Checks one app's migrations (pass them in the order they are applied). */
export function checkRls(files: readonly MigrationFile[]): Violation[] {
  const tables = new Map<string, TableInfo>();
  const violations: Violation[] = [];

  for (const file of files) {
    const sql = stripSql(file.sql);

    for (const match of sql.matchAll(CREATE_TABLE)) {
      if (match[1]) continue; // temporary tables are session-local and never exposed
      const name = normalizeTable(match[2] ?? "");
      tables.set(name, {
        path: file.path,
        line: lineAt(sql, match.index),
        rls: false,
        policies: 0,
        dropped: false,
      });
    }
    for (const match of sql.matchAll(ENABLE_RLS)) {
      const table = tables.get(normalizeTable(match[1] ?? ""));
      if (table) table.rls = true;
    }
    for (const match of sql.matchAll(CREATE_POLICY)) {
      const table = tables.get(normalizeTable(match[1] ?? ""));
      if (table) table.policies++;
    }
    for (const match of sql.matchAll(DROP_TABLE)) {
      const table = tables.get(normalizeTable(match[1] ?? ""));
      if (table) table.dropped = true;
    }
    for (const match of sql.matchAll(DISABLE_RLS)) {
      violations.push({
        path: file.path,
        line: lineAt(sql, match.index),
        message: `RLS is disabled on ${normalizeTable(match[1] ?? "")}. Never disable RLS; fix the policies instead.`,
      });
    }
  }

  for (const [name, table] of tables) {
    if (table.dropped) continue;
    const missing = [
      table.rls ? null : `\`alter table ${name} enable row level security;\``,
      table.policies > 0 ? null : `at least one \`create policy ... on ${name}\``,
    ].filter((m): m is string => m !== null);
    if (missing.length > 0) {
      violations.push({
        path: table.path,
        line: table.line,
        message: `Table ${name} is missing ${missing.join(" and ")}. Add them in a migration (see the add-db-table skill).`,
      });
    }
  }

  return violations;
}

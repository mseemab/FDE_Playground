/**
 * CI check: every table created in apps/*\/supabase/migrations has RLS enabled and at least one
 * policy. Run with `pnpm check:rls` (also part of `pnpm check`).
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { checkRls, type MigrationFile } from "../lib/rls";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const appsDir = path.join(repoRoot, "apps");

async function migrationsFor(app: string): Promise<MigrationFile[]> {
  const dir = path.join(appsDir, app, "supabase", "migrations");
  if (!existsSync(dir)) return [];
  const names = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
  return Promise.all(
    names.map(async (name) => ({
      path: path.relative(repoRoot, path.join(dir, name)),
      sql: await readFile(path.join(dir, name), "utf8"),
    })),
  );
}

const apps = existsSync(appsDir) ? await readdir(appsDir) : [];
let checked = 0;
let failures = 0;
for (const app of apps) {
  const files = await migrationsFor(app);
  checked += files.length;
  for (const violation of checkRls(files)) {
    failures++;
    console.error(`${violation.path}:${String(violation.line)}  ${violation.message}`);
  }
}

if (failures > 0) {
  console.error(
    `\n✖ RLS check failed: ${String(failures)} problem(s). Every table needs RLS and a policy.`,
  );
  process.exit(1);
}
console.log(`✔ RLS check passed (${String(checked)} migration file(s) checked).`);

/**
 * CI check: keeps the agent harness honest.
 *  - root AGENTS.md stays an index (≤ ROOT_AGENTS_MAX_LINES lines)
 *  - every app/template AGENTS.md stays short (≤ APP_AGENTS_MAX_LINES lines)
 *  - every CLAUDE.md contains only `@AGENTS.md` and has an AGENTS.md next to it
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  APP_AGENTS_MAX_LINES,
  claudeMdProblem,
  lineCount,
  ROOT_AGENTS_MAX_LINES,
} from "../lib/harness";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const problems: string[] = [];

async function memberDirs(parent: string): Promise<string[]> {
  const dir = path.join(repoRoot, parent);
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => path.join(parent, e.name));
}

async function checkDir(rel: string, maxLines: number, required: boolean): Promise<void> {
  const agents = path.join(repoRoot, rel, "AGENTS.md");
  const claude = path.join(repoRoot, rel, "CLAUDE.md");
  const label = rel === "" ? "" : `${rel}/`;
  if (!existsSync(agents)) {
    if (required) problems.push(`${label}AGENTS.md is missing.`);
  } else {
    const lines = lineCount(await readFile(agents, "utf8"));
    if (lines > maxLines) {
      problems.push(
        `${label}AGENTS.md has ${String(lines)} lines (max ${String(maxLines)}). Move detail into docs/ and link to it.`,
      );
    }
  }
  if (existsSync(claude)) {
    const problem = claudeMdProblem(await readFile(claude, "utf8"));
    if (problem) problems.push(`${label}CLAUDE.md ${problem}.`);
    if (!existsSync(agents))
      problems.push(`${label}CLAUDE.md imports AGENTS.md, which does not exist.`);
  } else if (required) {
    problems.push(`${label}CLAUDE.md is missing (it should contain only "@AGENTS.md").`);
  }
}

await checkDir("", ROOT_AGENTS_MAX_LINES, true);
for (const dir of [...(await memberDirs("apps")), ...(await memberDirs("templates"))]) {
  await checkDir(dir, APP_AGENTS_MAX_LINES, true);
}
for (const dir of await memberDirs("packages")) await checkDir(dir, APP_AGENTS_MAX_LINES, false);

if (problems.length > 0) {
  for (const problem of problems) console.error(`✖ ${problem}`);
  process.exit(1);
}
console.log("✔ AGENTS.md / CLAUDE.md check passed.");

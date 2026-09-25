/**
 * Scaffolder: `pnpm new-project <slug>`.
 *
 * Copies templates/next-app to apps/<slug>, creates the brief and portfolio row, installs
 * dependencies, runs the new app's checks and prints the remaining manual steps.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { addPortfolioRow, portfolioSlugs, renderBrief } from "./lib/docs";
import { slugError } from "./lib/slug";
import { renderTemplateFile, shouldCopy } from "./lib/template";

const repoRoot = path.resolve(import.meta.dirname, "..");
const templateDir = path.join(repoRoot, "templates", "next-app");
const appsDir = path.join(repoRoot, "apps");
const briefsDir = path.join(repoRoot, "docs", "briefs");
const portfolioPath = path.join(repoRoot, "docs", "portfolio.md");

/** Text files get placeholders replaced; anything else is copied byte-for-byte. */
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".css",
  ".example",
  ".toml",
  ".sql",
  ".yml",
  ".yaml",
]);

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function run(command: string, args: string[]): void {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd: repoRoot, stdio: "inherit" });
}

async function listApps(): Promise<string[]> {
  if (!existsSync(appsDir)) return [];
  const entries = await readdir(appsDir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function copyTemplate(slug: string, targetDir: string): Promise<number> {
  await cp(templateDir, targetDir, {
    recursive: true,
    filter: (source) => shouldCopy(path.relative(templateDir, source)),
  });
  const files = await readdir(targetDir, { recursive: true, withFileTypes: true });
  let rendered = 0;
  for (const file of files) {
    if (!file.isFile()) continue;
    const ext = path.extname(file.name) || file.name;
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    const filePath = path.join(file.parentPath, file.name);
    const before = await readFile(filePath, "utf8");
    const after = renderTemplateFile(before, slug);
    if (after !== before) {
      await writeFile(filePath, after);
      rendered++;
    }
  }
  return rendered;
}

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug || process.argv.length > 3)
    fail("Usage: pnpm new-project <slug>   (e.g. pnpm new-project pantry-pal)");

  const portfolio = await readFile(portfolioPath, "utf8");
  const error = slugError(slug, {
    existingApps: await listApps(),
    portfolioSlugs: portfolioSlugs(portfolio),
  });
  if (error) fail(error);

  const date = new Date().toISOString().slice(0, 10);
  const targetDir = path.join(appsDir, slug);

  await mkdir(appsDir, { recursive: true });
  const rendered = await copyTemplate(slug, targetDir);
  console.log(
    `✔ Created apps/${slug} from templates/next-app (${String(rendered)} files personalised)`,
  );

  const briefPath = path.join(briefsDir, `${slug}.md`);
  const briefExisted = existsSync(briefPath);
  if (briefExisted) {
    console.log(`✔ Brief already exists: docs/briefs/${slug}.md`);
  } else {
    const template = await readFile(path.join(briefsDir, "TEMPLATE.md"), "utf8");
    await writeFile(briefPath, renderBrief(template, slug, date));
    console.log(`✔ Created docs/briefs/${slug}.md from the template (fill it in!)`);
  }

  await writeFile(portfolioPath, addPortfolioRow(portfolio, slug, date));
  console.log(`✔ Added ${slug} to docs/portfolio.md (status: building)`);

  try {
    run("pnpm", ["install"]);
    run("pnpm", ["turbo", "run", "lint", "typecheck", "test", `--filter=@apps/${slug}`]);
  } catch {
    fail(
      `apps/${slug} was created but its checks failed. Fix the scaffolder or template (not just the ` +
        `new app) so the next project doesn't hit the same problem, then re-run the checks.`,
    );
  }

  console.log(`
✔ apps/${slug} is ready and passes lint, typecheck and tests.

Next steps:
  1. ${briefExisted ? "Review" : "Fill in"} docs/briefs/${slug}.md, then register its events in apps/${slug}/src/analytics.ts
     and docs/analytics.md (see the add-analytics-event skill).
  2. Run it: pnpm --filter ${slug} dev
  3. Manual setup (only the human can do these):
     - Vercel: New Project → import this repo → Root Directory: apps/${slug}
       (the "Include files outside the root directory" option must stay enabled).
       Build skipping is preconfigured in apps/${slug}/vercel.json (turbo-ignore): Vercel only
       builds when this app or a package it depends on changed.
     - Vercel env vars: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
       (see apps/${slug}/.env.example).
     - Domain: add it under the Vercel project's Settings → Domains.
`);
}

await main();

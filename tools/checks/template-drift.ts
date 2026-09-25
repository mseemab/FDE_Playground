/**
 * Warning-only check: reports where an app's shared config or dependency versions have drifted
 * from templates/next-app. Drift isn't always wrong, but improvements made in one app should be
 * pulled back into the template (and vice versa) so new projects start from the best version.
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { dependencyDrift, DRIFT_FILES, fileDrifted } from "../lib/harness";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const templateDir = path.join(repoRoot, "templates", "next-app");
const appsDir = path.join(repoRoot, "apps");

const apps = existsSync(appsDir)
  ? (await readdir(appsDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  : [];

let warnings = 0;
for (const slug of apps) {
  const appDir = path.join(appsDir, slug);
  for (const file of DRIFT_FILES) {
    const tpl = path.join(templateDir, file);
    const own = path.join(appDir, file);
    if (!existsSync(tpl)) continue;
    if (!existsSync(own)) {
      console.warn(`⚠ apps/${slug}/${file} is missing (the template has one).`);
      warnings++;
    } else if (fileDrifted(await readFile(tpl, "utf8"), await readFile(own, "utf8"), slug)) {
      console.warn(`⚠ apps/${slug}/${file} differs from templates/next-app/${file}.`);
      warnings++;
    }
  }
  const drift = dependencyDrift(
    await readFile(path.join(templateDir, "package.json"), "utf8"),
    await readFile(path.join(appDir, "package.json"), "utf8"),
  );
  for (const d of drift) {
    console.warn(`⚠ apps/${slug}: ${d.name} is ${d.app ?? "missing"} (template: ${d.template}).`);
    warnings++;
  }
}

console.log(
  warnings === 0
    ? `✔ No template drift across ${String(apps.length)} app(s).`
    : `⚠ ${String(warnings)} drift warning(s). Not a failure: sync the template or the app if the difference isn't intentional.`,
);

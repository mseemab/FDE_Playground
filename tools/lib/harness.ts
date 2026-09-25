import { renderTemplateFile } from "./template";

export const ROOT_AGENTS_MAX_LINES = 110;
export const APP_AGENTS_MAX_LINES = 50;

export function lineCount(content: string): number {
  return content.replace(/\n+$/, "").split("\n").length;
}

/** A CLAUDE.md must contain only `@AGENTS.md`, so AGENTS.md stays the single source of truth. */
export function claudeMdProblem(content: string): string | null {
  return content.trim() === "@AGENTS.md"
    ? null
    : 'must contain only "@AGENTS.md" (put instructions in AGENTS.md, not CLAUDE.md)';
}

/** Config files every app shares with the template; differences are reported as drift. */
export const DRIFT_FILES = [
  "tsconfig.json",
  "eslint.config.js",
  "next.config.ts",
  "postcss.config.mjs",
  "vitest.config.ts",
  "playwright.config.ts",
  "vercel.json",
  "components.json",
];

export interface DependencyDrift {
  name: string;
  template: string;
  app: string | undefined;
}

/** Dependencies whose versions differ from the template's (missing ones included). */
export function dependencyDrift(templatePkg: string, appPkg: string): DependencyDrift[] {
  type Pkg = { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  const tpl = JSON.parse(templatePkg) as Pkg;
  const app = JSON.parse(appPkg) as Pkg;
  const appDeps = { ...app.dependencies, ...app.devDependencies };
  return Object.entries({ ...tpl.dependencies, ...tpl.devDependencies })
    .filter(([name, version]) => appDeps[name] !== version)
    .map(([name, version]) => ({ name, template: version, app: appDeps[name] }));
}

/** True when an app's copy of a template config file differs from the rendered template. */
export function fileDrifted(templateContent: string, appContent: string, slug: string): boolean {
  return renderTemplateFile(templateContent, slug).trim() !== appContent.trim();
}

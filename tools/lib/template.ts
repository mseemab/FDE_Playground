import { TEMPLATE_SLUG, titleCase } from "./slug";

/** Paths (relative to the template root) that are build output or local state, never copied. */
const SKIP = [
  /^node_modules(\/|$)/,
  /^\.next(\/|$)/,
  /^\.turbo(\/|$)/,
  /^test-results(\/|$)/,
  /^playwright-report(\/|$)/,
  /^next-env\.d\.ts$/,
  /\.tsbuildinfo$/,
  /^\.env(?!\.example$)/,
];

export function shouldCopy(relativePath: string): boolean {
  const normalized = relativePath.split("\\").join("/");
  return !SKIP.some((pattern) => pattern.test(normalized));
}

/**
 * Turns template content into app content. The template is a real, working app named
 * `template-next-app`, so the slug and its title-case form are the only placeholders.
 */
export function renderTemplateFile(content: string, slug: string): string {
  return content
    .replaceAll(TEMPLATE_SLUG, slug)
    .replaceAll(titleCase(TEMPLATE_SLUG), titleCase(slug));
}

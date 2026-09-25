export const TEMPLATE_SLUG = "template-next-app";

const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** Names that would collide with workspace packages, folders or routes. */
const RESERVED = new Set([
  TEMPLATE_SLUG,
  "analytics",
  "api",
  "app",
  "apps",
  "config",
  "docs",
  "supabase",
  "tools",
  "ui",
]);

export interface SlugContext {
  existingApps: readonly string[];
  portfolioSlugs: readonly string[];
}

/** Returns an error message for an invalid slug, or null when the slug can be used. */
export function slugError(
  slug: string,
  { existingApps, portfolioSlugs }: SlugContext,
): string | null {
  if (!SLUG_PATTERN.test(slug)) {
    return `"${slug}" is not kebab-case. Use lowercase letters, digits and single hyphens, starting with a letter (e.g. pantry-pal).`;
  }
  if (slug.length < 3 || slug.length > 40) return `"${slug}" must be 3–40 characters long.`;
  if (RESERVED.has(slug)) return `"${slug}" is reserved. Pick another slug.`;
  if (existingApps.includes(slug)) return `apps/${slug} already exists. Pick another slug.`;
  if (portfolioSlugs.includes(slug)) {
    return `"${slug}" is already in docs/portfolio.md (slugs are never reused, even for killed projects).`;
  }
  return null;
}

/** "pantry-pal" → "Pantry Pal" */
export function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

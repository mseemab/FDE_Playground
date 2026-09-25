/** Fills docs/briefs/TEMPLATE.md for a new project. */
export function renderBrief(template: string, slug: string, date: string): string {
  return template.replaceAll("__SLUG__", slug).replaceAll("__DATE__", date);
}

const ROW_PATTERN = /^\|\s*\[?`?([a-z0-9-]+)`?\]?/;

/** Slugs already listed in the portfolio table (skips the header and separator rows). */
export function portfolioSlugs(markdown: string): string[] {
  const slugs: string[] = [];
  for (const line of markdown.split("\n")) {
    if (!line.startsWith("|") || line.startsWith("| Slug") || line.startsWith("| --")) continue;
    const match = ROW_PATTERN.exec(line);
    if (match?.[1]) slugs.push(match[1]);
  }
  return slugs;
}

/** Appends a `building` row for the new project to the portfolio table. */
export function addPortfolioRow(markdown: string, slug: string, date: string): string {
  const row = `| ${slug} | building | [brief](briefs/${slug}.md) | ${date} | — | — | — |`;
  const trimmed = markdown.replace(/\n+$/, "");
  return `${trimmed}\n${row}\n`;
}

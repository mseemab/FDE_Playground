import { describe, expect, it } from "vitest";
import { addPortfolioRow, portfolioSlugs, renderBrief } from "./docs";

const portfolio = `# Portfolio

| Slug | Status | Brief | Created | Launch date | Decision date | Outcome |
| ---- | ------ | ----- | ------- | ----------- | ------------- | ------- |
| alpha | killed | [brief](briefs/alpha.md) | 2026-01-01 | 2026-02-01 | 2026-03-01 | No demand |
`;

describe("portfolio", () => {
  it("lists existing slugs", () => {
    expect(portfolioSlugs(portfolio)).toEqual(["alpha"]);
  });

  it("appends a building row", () => {
    const next = addPortfolioRow(portfolio, "pantry-pal", "2026-09-25");
    expect(
      next.endsWith(
        "| pantry-pal | building | [brief](briefs/pantry-pal.md) | 2026-09-25 | — | — | — |\n",
      ),
    ).toBe(true);
    expect(portfolioSlugs(next)).toEqual(["alpha", "pantry-pal"]);
  });
});

describe("renderBrief", () => {
  it("fills slug and date placeholders", () => {
    expect(renderBrief("# Brief: __SLUG__ (__DATE__)", "pantry-pal", "2026-09-25")).toBe(
      "# Brief: pantry-pal (2026-09-25)",
    );
  });
});

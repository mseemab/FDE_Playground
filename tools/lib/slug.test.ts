import { describe, expect, it } from "vitest";
import { slugError, titleCase } from "./slug";

const empty = { existingApps: [], portfolioSlugs: [] };

describe("slugError", () => {
  it("accepts a kebab-case slug", () => {
    expect(slugError("pantry-pal", empty)).toBeNull();
  });

  it.each(["Pantry", "pantry_pal", "pantry--pal", "-pantry", "pantry-", "1pantry", "a b"])(
    "rejects %s as not kebab-case",
    (slug) => {
      expect(slugError(slug, empty)).toMatch(/kebab-case/);
    },
  );

  it("rejects reserved names", () => {
    expect(slugError("template-next-app", empty)).toMatch(/reserved/);
  });

  it("rejects slugs that exist as apps or in the portfolio", () => {
    expect(slugError("pantry-pal", { ...empty, existingApps: ["pantry-pal"] })).toMatch(
      /already exists/,
    );
    expect(slugError("pantry-pal", { ...empty, portfolioSlugs: ["pantry-pal"] })).toMatch(
      /portfolio/,
    );
  });
});

describe("titleCase", () => {
  it("title-cases each word", () => {
    expect(titleCase("pantry-pal")).toBe("Pantry Pal");
  });
});

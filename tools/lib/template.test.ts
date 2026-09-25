import { describe, expect, it } from "vitest";
import { renderTemplateFile, shouldCopy } from "./template";

describe("shouldCopy", () => {
  it.each(["src/app/page.tsx", ".env.example", "e2e/smoke.spec.ts", "AGENTS.md"])(
    "copies %s",
    (p) => {
      expect(shouldCopy(p)).toBe(true);
    },
  );

  it.each([
    "node_modules/next/index.js",
    ".next/build",
    ".turbo/x",
    "next-env.d.ts",
    ".env.local",
    "tsconfig.tsbuildinfo",
    "test-results/a",
  ])("skips %s", (p) => {
    expect(shouldCopy(p)).toBe(false);
  });
});

describe("renderTemplateFile", () => {
  it("replaces the package name, analytics app, brief link and title", () => {
    const input = [
      '"name": "@apps/template-next-app"',
      'app: "template-next-app"',
      "docs/briefs/template-next-app.md",
      "<h1>Template Next App</h1>",
    ].join("\n");
    expect(renderTemplateFile(input, "pantry-pal")).toBe(
      [
        '"name": "@apps/pantry-pal"',
        'app: "pantry-pal"',
        "docs/briefs/pantry-pal.md",
        "<h1>Pantry Pal</h1>",
      ].join("\n"),
    );
  });
});

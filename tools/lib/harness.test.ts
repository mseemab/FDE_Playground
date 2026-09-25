import { describe, expect, it } from "vitest";
import { claudeMdProblem, dependencyDrift, fileDrifted, lineCount } from "./harness";

describe("claudeMdProblem", () => {
  it("accepts a CLAUDE.md that only imports AGENTS.md", () => {
    expect(claudeMdProblem("@AGENTS.md\n")).toBeNull();
  });

  it("rejects anything else", () => {
    expect(claudeMdProblem("@AGENTS.md\nAlso do X")).toMatch(/only "@AGENTS.md"/);
  });
});

describe("lineCount", () => {
  it("ignores trailing newlines", () => {
    expect(lineCount("a\nb\n\n")).toBe(2);
  });
});

describe("dependencyDrift", () => {
  it("reports changed and missing dependencies", () => {
    const tpl = JSON.stringify({
      dependencies: { next: "16.3.6", zod: "4.6.5" },
      devDependencies: { vitest: "5.0.1" },
    });
    const app = JSON.stringify({ dependencies: { next: "16.3.5", zod: "4.6.5", extra: "1.0.0" } });
    expect(dependencyDrift(tpl, app)).toEqual([
      { name: "next", template: "16.3.6", app: "16.3.5" },
      { name: "vitest", template: "5.0.1", app: undefined },
    ]);
  });
});

describe("fileDrifted", () => {
  it("compares against the template rendered for the app's slug", () => {
    expect(
      fileDrifted(
        'const name = "template-next-app";\n',
        'const name = "pantry-pal";',
        "pantry-pal",
      ),
    ).toBe(false);
    expect(
      fileDrifted('const name = "template-next-app";', 'const name = "other";', "pantry-pal"),
    ).toBe(true);
  });
});

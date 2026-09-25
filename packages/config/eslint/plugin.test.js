import path from "node:path";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import plugin from "./plugin.js";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const repo = path.resolve(import.meta.dirname, "../../..");
const at = (/** @type {string} */ rel) => path.join(repo, rel);
const rule = (/** @type {string} */ name) => {
  const r = plugin.rules?.[name];
  if (!r || typeof r === "function") throw new Error(`missing rule ${name}`);
  return r;
};

const tester = new RuleTester({ languageOptions: { ecmaVersion: "latest", sourceType: "module" } });

tester.run("no-cross-workspace-imports", rule("no-cross-workspace-imports"), {
  valid: [
    { filename: at("apps/alpha/src/app/page.tsx"), code: 'import { Button } from "@factory/ui";' },
    { filename: at("apps/alpha/src/app/page.tsx"), code: 'import { x } from "../server/x";' },
    { filename: at("apps/alpha/src/app/page.tsx"), code: 'import { x } from "@apps/alpha/thing";' },
    { filename: at("packages/ui/src/button.tsx"), code: 'import { cn } from "./lib/utils";' },
  ],
  invalid: [
    {
      filename: at("apps/alpha/src/app/page.tsx"),
      code: 'import { x } from "@apps/beta/src/x";',
      errors: [{ messageId: "appImportsApp" }],
    },
    {
      filename: at("apps/alpha/src/app/page.tsx"),
      code: 'import { x } from "../../../beta/src/x";',
      errors: [{ messageId: "appImportsApp" }],
    },
    {
      filename: at("packages/ui/src/button.tsx"),
      code: 'export { x } from "../../../apps/alpha/src/x";',
      errors: [{ messageId: "packageImportsApp" }],
    },
    {
      filename: at("packages/ui/src/button.tsx"),
      code: 'const m = await import("@apps/alpha");',
      errors: [{ messageId: "packageImportsApp" }],
    },
    {
      filename: at("apps/alpha/src/app/page.tsx"),
      code: 'import { track } from "../../../../packages/analytics/src/index";',
      errors: [{ messageId: "relativeIntoWorkspace" }],
    },
  ],
});

tester.run("no-server-import-in-client", rule("no-server-import-in-client"), {
  valid: [
    { filename: at("apps/alpha/src/app/page.tsx"), code: 'import { db } from "@/server/db";' },
    {
      filename: at("apps/alpha/src/components/form.tsx"),
      code: '"use client";\nimport { track } from "@factory/analytics";',
    },
  ],
  invalid: [
    {
      filename: at("apps/alpha/src/components/form.tsx"),
      code: '"use client";\nimport { db } from "@/server/db";',
      errors: [{ messageId: "serverInClient" }],
    },
    {
      filename: at("apps/alpha/src/components/form.tsx"),
      code: '"use client";\nimport { db } from "../server/db";',
      errors: [{ messageId: "serverInClient" }],
    },
    {
      filename: at("apps/alpha/src/components/form.tsx"),
      code: '"use client";\nimport { captureServer } from "@factory/analytics/server";',
      errors: [{ messageId: "serverInClient" }],
    },
    {
      filename: at("apps/alpha/src/components/form.tsx"),
      code: '"use client";\nimport "server-only";',
      errors: [{ messageId: "serverInClient" }],
    },
  ],
});

tester.run("require-server-only", rule("require-server-only"), {
  valid: [{ code: 'import "server-only";\nexport const x = 1;' }],
  invalid: [{ code: "export const x = 1;", errors: [{ messageId: "missing" }] }],
});

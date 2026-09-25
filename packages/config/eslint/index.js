import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { importX } from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import factory from "./plugin.js";

/**
 * @typedef {object} Options
 * @property {string} tsconfigRootDir pass `import.meta.dirname` from the package's eslint.config.js
 * @property {"app" | "package" | "template" | "tool"} kind
 */

const TS_FILES = ["**/*.{ts,tsx,mts,cts}"];
const JS_FILES = ["**/*.{js,jsx,mjs,cjs}"];
const TEST_FILES = ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "e2e/**"];

/**
 * Base config for every workspace member: typescript-eslint strict type-checked plus the
 * factory dependency rules.
 * @param {Options} options
 */
export function base({ tsconfigRootDir, kind }) {
  return defineConfig(
    globalIgnores([
      "**/node_modules/",
      "**/dist/",
      "**/.next/",
      "**/.turbo/",
      "**/coverage/",
      "**/playwright-report/",
      "**/test-results/",
      "**/next-env.d.ts",
    ]),
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    {
      languageOptions: {
        globals: { ...globals.node },
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      linterOptions: { reportUnusedDisableDirectives: "error" },
    },
    {
      files: JS_FILES,
      extends: [tseslint.configs.disableTypeChecked],
    },

    // --- Dependency rules (docs/ARCHITECTURE.md) ---
    {
      plugins: { factory, "import-x": importX },
      settings: {
        "import-x/resolver-next": [createTypeScriptImportResolver({ alwaysTryTypes: true })],
        "import-x/internal-regex": "^@/",
      },
      rules: {
        "factory/no-cross-workspace-imports": "error",
        "import-x/no-extraneous-dependencies": [
          "error",
          { devDependencies: true, peerDependencies: true, includeTypes: true },
        ],
      },
    },
    kind === "app"
      ? {}
      : {
          rules: {
            "no-restricted-imports": [
              "error",
              {
                patterns: [
                  {
                    group: ["@apps/*"],
                    message:
                      "Packages, templates and tools must never import from apps. Move the shared code into a package under packages/.",
                  },
                ],
              },
            ],
          },
        },
    {
      files: ["**/src/server/**/*.{ts,tsx}"],
      ignores: TEST_FILES,
      rules: { "factory/require-server-only": "error" },
    },
    {
      files: [...TS_FILES, ...JS_FILES],
      rules: { "factory/no-server-import-in-client": "error" },
    },
  );
}

/**
 * Config for Next.js apps (and the app template): base + Next.js + React Hooks rules.
 * @param {Omit<Options, "kind"> & { kind?: "app" | "template" }} options
 */
export function next({ tsconfigRootDir, kind = "app" }) {
  return defineConfig(base({ tsconfigRootDir, kind }), reactHooks.configs.flat.recommended, {
    plugins: { "@next/next": nextPlugin },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  });
}

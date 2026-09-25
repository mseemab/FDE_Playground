---
name: promote-to-package
description: Move code from one app into a shared package because a second app now needs it (rule of two). Use when about to copy code between apps or when a lint error says apps can't import from each other.
argument-hint: "<from-slug> <code> <to-package>"
---

# Promote code to a package

Rule of two: code stays in its app until a **second** app needs it. Then it moves, once.

## Steps

1. **Confirm the second use is real** (a feature being built now, not "might need later").
2. **Pick the home:** an existing package if it fits (`@factory/ui` for UI primitives,
   `@factory/analytics`, `@factory/supabase`), else a new `packages/<name>` named for what it
   does. Copy an existing package's `package.json`, `tsconfig.json`, `eslint.config.js` and
   `vitest.config.ts` as the starting point.
3. **Move, don't copy:** `git mv` the files; make them app-agnostic (no `@/` imports, no app
   env vars; take config as arguments). Server-only code goes behind a `./server` export with
   `import "server-only"`.
4. **Declare dependencies** in the package's `package.json`; add `"@factory/<name>":
"workspace:*"` to both apps (and `transpilePackages` in their `next.config.ts` if it ships
   TS/TSX). Run `pnpm install`.
5. **Update both apps** to import from the package; delete the old copies.
6. **Tests move with the code**; add one if the code had none.
7. **Checks:** `pnpm check` (full, not affected: every dependent app must pass), plus build
   and smoke tests for both apps.
8. **PR:** tick "Shared packages" in the PR template.

## Done checklist

- [ ] Code lives only in the package; both apps import it by package name
- [ ] Package has its own tests, lint and typecheck
- [ ] Dependencies declared everywhere they're used
- [ ] `pnpm check` and both apps' build + smoke tests pass

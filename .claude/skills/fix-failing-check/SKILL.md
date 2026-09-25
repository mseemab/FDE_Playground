---
name: fix-failing-check
description: Fix a failing lint, typecheck, test, build, e2e or repo check (locally or in CI). Use whenever a check is red. Reproduce locally, find the root cause, fix it, never skip or weaken the check.
argument-hint: "<check or CI job>"
---

# Fix a failing check

## Steps

1. **Reproduce locally** with the same command CI ran:
   - PR CI: `TURBO_SCM_BASE=origin/main pnpm check:affected`,
     `pnpm exec turbo run build test:e2e --affected`
   - Single package: `pnpm turbo run <task> --filter <package>`
   - Repo checks: `pnpm check:repo` (RLS, AGENTS.md/CLAUDE.md, template drift)
2. **Read the whole error.** Factory lint rules say what to do instead; follow them.
3. **Find the root cause**, not the nearest place to make the error go away. Ask: is the code
   wrong, the test wrong, or the harness (rule, template, docs) wrong?
4. **Fix the cause.** Forbidden: `eslint-disable`, `@ts-ignore`/`@ts-expect-error` to hide
   real errors, `.skip`/`.only`, loosening tsconfig or lint rules, deleting assertions,
   `--passWithNoTests`, retries to hide flakiness. If a rule is genuinely wrong, change it in
   `packages/config` in its own PR and explain why.
5. **Flaky test?** Find why (timing, shared state, selector matching two elements) and make it
   deterministic.
6. **Re-run** the failing command, then `pnpm check:affected`.
7. **If the harness let this happen**, log it with log-harness-lesson.

## Done checklist

- [ ] Failure reproduced locally, root cause identified
- [ ] Fixed without skipping, disabling or weakening any check
- [ ] The originally failing command and `pnpm check:affected` pass

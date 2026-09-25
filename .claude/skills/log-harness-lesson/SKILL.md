---
name: log-harness-lesson
description: Record an agent mistake in docs/harness-log.md and ship the harness fix that prevents it. Use after any bug, failed check, review comment or rework that the harness could have prevented.
argument-hint: "<what went wrong>"
---

# Log a harness lesson

The factory improves only if each mistake changes the harness, not just the code.

## Steps

1. **Add a row** to `docs/harness-log.md`: date · app · what the agent got wrong (one
   sentence, concrete) · root cause (why the harness allowed it) · harness fix.
2. **Pick the strongest fix that fits**, in this order:
   1. A **check** that fails (lint rule in `packages/config/eslint`, test, `tools/checks/*`)
   2. A **template/scaffolder** change so new apps start right
   3. A **guardrail** (`.claude/settings.json` rule or `tools/hooks/guard-bash.ts`)
   4. A **skill** step or done-checklist item
   5. A **doc** line (`AGENTS.md`, `docs/golden-principles.md`); last resort, since docs don't enforce
3. **Implement the fix** in the same PR when it's small; otherwise propose it to the human with
   the row. Lint messages must say what to do instead.
4. **Keep root `AGENTS.md` ≤ ~100 lines**: put detail in `docs/` and link to it.

## Done checklist

- [ ] Row added to `docs/harness-log.md`
- [ ] Fix implemented (or proposed) at the strongest practical level
- [ ] `pnpm check` passes

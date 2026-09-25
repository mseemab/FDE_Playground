---
name: add-feature
description: Implement a user-facing feature in one app, end to end. Use for any "add/build/implement X in <app>" request. Plan file, implementation in the right layer, tests, analytics events, checks and a PR.
argument-hint: "<slug> <feature>"
---

# Add a feature

## Steps

1. **Context:** read `apps/<slug>/AGENTS.md` and `docs/briefs/<slug>.md`. Check the feature
   isn't on the brief's cut list. If it is, ask the human before building it.
2. **Plan** (if it's more than about an hour of work): create
   `docs/exec-plans/active/<slug>-<feature>.md` with Goal, Steps, Acceptance criteria and a
   Progress log. Update the log as you go.
3. **Branch:** `git switch -c feat/<slug>-<feature>`.
4. **Implement in the right layer** (see `docs/ARCHITECTURE.md` "What goes where"):
   server components and actions by default; Zod schemas in `src/lib/`; DB and secrets in
   `src/server/` (with `import "server-only"`); small client components only where needed.
   New env vars go in `src/env.ts` and `.env.example`. Needs a table? Use add-db-table.
5. **Tests:** unit tests for schemas and logic. Update `e2e/smoke.spec.ts` only if the critical
   path changed.
6. **Analytics:** emit every event the brief defines for this feature (add-analytics-event).
7. **Checks:** `pnpm check:affected` and
   `pnpm turbo run build test:e2e --filter @apps/<slug>`. Fix causes, never weaken checks.
8. **PR:** one feature, one app. Fill in the PR template honestly, including risk areas.
   Tick the plan's acceptance criteria; move the plan to `completed/` when merged.

## Done checklist

- [ ] Feature matches the brief and the plan's acceptance criteria
- [ ] All input validated with Zod; no server code imported by client components
- [ ] Tests added; brief's events emitted and registered
- [ ] `pnpm check:affected`, build and smoke test pass
- [ ] PR open with the template filled in

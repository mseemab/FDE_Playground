---
name: new-project
description: Start a new product in the factory. Use when the human asks to create, start or scaffold a new project/app from a brief. Confirms the brief, runs `pnpm new-project <slug>`, registers the brief's analytics events and lists the manual setup steps.
argument-hint: "<slug>"
---

# New project

## Steps

1. **Brief first.** Open `docs/briefs/<slug>.md`. If it doesn't exist or any section is still a
   placeholder, stop and ask the human for the missing parts (target user, problem, riskiest
   assumption, first 50 users, core action, events, kill criteria, cut list, launch date).
   If they have no slug yet, propose one (kebab-case, 3–40 chars).
2. **Scaffold:** `pnpm new-project <slug>`. It validates the slug, copies `templates/next-app`,
   personalises names, adds the portfolio row, installs and runs the app's checks.
   If anything fails or feels clunky, fix the **scaffolder or template** (not just the new app)
   and log it with the log-harness-lesson skill.
3. **Analytics:** for each event in the brief's "Events to track" table, follow the
   add-analytics-event skill. Only register events the app will emit soon; `waitlist_joined`
   is already there.
4. **Personalise the landing page** (`src/app/page.tsx`, `layout.tsx` metadata) from the brief:
   one headline, one sentence of value, the waitlist form. Keep `/privacy` and `/terms` as DRAFT.
5. **Backend?** If the brief needs data or logins, run the add-backend skill (separate PR).
6. **Verify:** `pnpm turbo run lint typecheck test build test:e2e --filter @apps/<slug>`.
7. **PR:** branch `feat/<slug>-scaffold`, `gh pr create` using the PR template.
8. **Tell the human the manual steps** the scaffolder printed: Vercel project (root directory
   `apps/<slug>`; build skipping is preconfigured in `vercel.json`), env vars from
   `apps/<slug>/.env.example`, domain.

## Done checklist

- [ ] Brief complete, linked from `docs/portfolio.md` (status `building`)
- [ ] `apps/<slug>` passes lint, typecheck, unit tests, build and smoke test
- [ ] Brief events registered in `src/analytics.ts` and `docs/analytics.md`
- [ ] PR open; manual steps listed for the human

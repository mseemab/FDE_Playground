# Project Factory — Setup Spec for Claude Code (monorepo, built for scale)

## Context
I'm a solo founder building an agent-first "project factory": many small products, each launched fast and then kept or killed based on real adoption data. This repo is the factory. It holds one shared harness, shared packages, and one folder per project. Projects are independent at runtime (own hosting project, domain, database) but share rules, tooling, and code at build time. Every lesson learned on one project must improve all future projects.

Optimize for: time from brief to launched project, machine-enforced quality, clean project kills, and a harness that makes future agent sessions reliable.

## How to work through this spec
- Start in plan mode. Read this whole file, ask me about anything ambiguous, then propose a phase-by-phase plan. Do not write code until I approve.
- Work one phase at a time. At the end of each phase: run all checks, commit, summarize, and stop for my review.
- Where you're unsure of a tool's current config format (Claude Code settings/skills, Next.js, Tailwind, Turborepo, Supabase CLI, Vercel monorepo settings), check official docs instead of guessing.
- Never read, print, or commit `.env*` files other than `.env.example`. When secrets are needed, add the variable name to the relevant `.env.example` and tell me what to fill in and where to get it.
- If I haven't provided a brief for project #1 by Phase 3, ask me for a slug and create a brief from the template with placeholders.

## Fixed decisions (do not substitute)
- **Repo:** one private GitHub monorepo, pnpm workspaces + Turborepo (no remote cache, no accounts).
- **Language:** TypeScript, `strict: true` plus `noUncheckedIndexedAccess`, via a shared base tsconfig.
- **Runtime:** current Node LTS pinned in `.nvmrc` and root `package.json` engines.
- **Apps:** Next.js, latest stable, App Router, `src/` directory.
- **UI:** Tailwind CSS + shadcn/ui, shared through `packages/ui`.
- **Validation:** Zod at every boundary (forms, route handlers, server actions, env vars, external data). Each app validates env at startup in `src/env.ts`.
- **Lint/format:** ESLint (typescript-eslint strict type-checked) and Prettier, configs shared from `packages/config`.
- **Tests:** Vitest for unit tests; Playwright for one end-to-end smoke test per app (Chromium only).
- **Analytics:** PostHog, one PostHog project for all apps; every event carries `app: "<slug>"`.
- **Backend, only for apps that need data or logins:** Supabase, one Supabase project per app, Supabase Auth with Google sign-in only, SQL migrations via Supabase CLI, generated TypeScript types. No ORM.
- **Hosting:** Vercel, one Vercel project per app, root directory set to `apps/<slug>`.
- **CI:** GitHub Actions.
- **No other services, SaaS, or paid dependencies without asking me first.**

## Target structure
```
/
├── AGENTS.md                 # factory-wide rules (index, ~100 lines)
├── CLAUDE.md                 # contains only: @AGENTS.md
├── .claude/
│   ├── settings.json
│   └── skills/<name>/SKILL.md
├── apps/
│   └── <slug>/               # one per project
│       ├── AGENTS.md         # app-specific context (~30 lines), links to its brief
│       ├── CLAUDE.md         # contains only: @AGENTS.md
│       ├── src/ (app/, components/, server/, env.ts)
│       ├── e2e/              # Playwright smoke test
│       ├── supabase/         # only if the app has a backend
│       └── .env.example
├── packages/
│   ├── config/               # tsconfig base, eslint config, prettier config
│   ├── ui/                   # shadcn/ui components, Tailwind setup
│   ├── analytics/            # PostHog provider + typed track() helper
│   └── supabase/             # created on first need (see add-backend skill)
├── templates/
│   └── next-app/             # canonical app template used by the scaffolder
├── tools/
│   ├── new-project.ts        # scaffolder: pnpm new-project <slug>
│   └── checks/               # custom CI checks (RLS, template drift, etc.)
└── docs/
    ├── ARCHITECTURE.md
    ├── golden-principles.md
    ├── analytics.md
    ├── portfolio.md          # table of all projects and their status
    ├── harness-log.md
    ├── briefs/ (TEMPLATE.md, <slug>.md)
    ├── decisions/
    └── exec-plans/ (active/, completed/)
```

## Dependency rules (enforce mechanically)
- Apps may import from `packages/*`. Packages never import from apps.
- Apps never import from other apps.
- Client components never import from an app's `src/server/` or from server-only package entry points. Server files import `server-only`.
- Every workspace dependency must be declared in that package's `package.json`.
- Enforce with ESLint `no-restricted-imports` (and pnpm's strict dependency resolution). Every custom rule's error message must tell the agent the correct alternative.
- **Rule of two:** code lives in an app until a second app needs it; then it moves to a package (see `promote-to-package` skill). Don't pre-build shared abstractions.

## Phase 1 — Workspace foundation
- Initialize the pnpm workspace and Turborepo with tasks: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`.
- Root scripts: `check` (lint + typecheck + test across the workspace), `check:affected` (same, only for packages changed vs `origin/main`), `format`, `new-project`.
- Create `packages/config` with the shared tsconfig base, ESLint config (including the dependency rules above), and Prettier config.
- Create a private GitHub repo with `gh`, push, commit.

## Phase 2 — Shared packages and the app template
- `packages/ui`: shadcn/ui setup and Tailwind configured so apps pick up classes from the package. Start with only the components the template needs.
- `packages/analytics`: a PostHog provider for the root layout, server-side capture helper, and a typed `track(event, props)` that requires the app to register its slug and its allowed event names, and always attaches `app`.
- `templates/next-app/`: a complete, working Next.js app using the packages above, with:
  - `src/env.ts` (Zod-validated), `.env.example`
  - landing page with a waitlist/signup placeholder
  - `/privacy` and `/terms` with placeholder text marked "DRAFT — needs legal review"
  - one Playwright smoke test
  - app-level `AGENTS.md` and `CLAUDE.md` with placeholders for slug and brief link
- The template must be a real workspace member that builds and tests in CI, so it can never silently rot.

## Phase 3 — Scaffolder and project #1
- `tools/new-project.ts`, run as `pnpm new-project <slug>`:
  - validates the slug (kebab-case, unique)
  - copies `templates/next-app/` to `apps/<slug>/` and replaces placeholders (package name, slug, analytics app name, brief link)
  - creates `docs/briefs/<slug>.md` from the template if it doesn't exist
  - adds a row to `docs/portfolio.md` (slug, status: building, brief link, created date)
  - installs dependencies and runs `check` for the new app
  - prints the manual steps remaining (Vercel project with root directory `apps/<slug>`, env vars, domain)
- Use the scaffolder to create project #1. Treat any friction as a scaffolder bug and fix it.

## Phase 4 — Quality gates
- GitHub Actions on every PR: install (pnpm cache), then `check:affected`, build, and Playwright smoke tests for affected apps. On push to `main`: the full `check`. Target under 5 minutes.
- Configure each Vercel project to skip builds when its app and its dependencies are unchanged (use Turborepo's ignore support).
- PR template: what changed, which app(s) or packages, why, how verified, and a checkbox list of risk areas (auth, data, billing, migrations, shared packages, agent settings).
- CI step that posts a warning comment (not a failure) when a PR touches `apps/*/supabase/migrations/`, `packages/supabase/`, `packages/config/`, or `.claude/settings.json`.
- `tools/checks/rls.ts`: fails CI when any `CREATE TABLE` in `apps/*/supabase/migrations/` lacks `ENABLE ROW LEVEL SECURITY` and at least one policy for that table.

## Phase 5 — Harness files

### Root AGENTS.md (about 100 lines max; an index, not an encyclopedia)
1. What this repo is (2–3 lines) and a link to `docs/portfolio.md`.
2. Commands: `check`, `check:affected`, `new-project`, how to run one app (`pnpm --filter <slug> dev`).
3. Structure map, one line per top-level folder.
4. Dependency rules (short form) and the rule of two.
5. Non-negotiables:
   - Run checks for everything you touched before declaring a task done.
   - Never read, print, or commit secrets or `.env` files.
   - Never push to `main`. Work on a branch; open a PR with `gh pr create`.
   - Every new table has RLS enabled with explicit policies. Never disable RLS.
   - Validate all external input with Zod.
   - Every user-facing feature emits the analytics events defined in its app's brief.
   - One feature per PR; one app per PR unless changing a shared package.
   - Changes to `packages/*` must keep every app passing.
   - Never disable, skip, or weaken a test or lint rule to make a check pass.
6. Workflow: for any task longer than about an hour, write a plan at `docs/exec-plans/active/<slug>-<task>.md` (goal, steps, acceptance criteria, progress log), update it as you go, move to `completed/` when merged.
7. Pointers into `docs/` and the skills list.

### docs/
- `ARCHITECTURE.md`: the layers, what goes where, runtime isolation per app, dependency rules, data flow.
- `golden-principles.md`: error handling, naming, logging, component patterns; short and concrete, one example each.
- `analytics.md`: naming (`object_action`, snake_case), required properties, and a section per app listing its events.
- `portfolio.md`: table of slug | status (building, live, killed, graduated) | brief | launch date | decision date | outcome.
- `briefs/TEMPLATE.md` fields: Target user · Problem · Riskiest assumption · First 50 users (who, and how I'll reach them) · Core action (definition of "activated") · Events to track · Kill criteria (measured after 4 weeks live) · Cut list · Launch date · Outcome and lessons (filled in at keep/kill).
- `decisions/0001-stack.md` and `decisions/0002-monorepo.md`: the fixed decisions above and why.
- `harness-log.md`: date | app | what the agent got wrong | root cause | harness fix (lint rule, test, doc line, skill).

### .claude/settings.json
- Deny: reading `.env*` files (except `.env.example`), `git push` to `main`, force pushes, `gh pr merge`, `rm -rf` outside the repo, and Supabase commands that target a remote or production project.
- Allow without prompting: pnpm and turbo scripts (dev, lint, typecheck, test, test:e2e, build, check, check:affected, format, new-project), git status/diff/add/commit/branch/switch/log, `gh pr create`, `gh pr view`.

### Skills (each `.claude/skills/<name>/SKILL.md`, short, with steps and a done-checklist)
1. `new-project`: confirm the brief exists and is filled in, run the scaffolder, register analytics events from the brief, list manual steps for me.
2. `add-feature`: plan file → implement in the right app → tests → analytics events → checks → PR.
3. `add-analytics-event`: naming, required properties, register in the app's event list, update `docs/analytics.md`.
4. `add-backend`: add Supabase to an app (creating `packages/supabase` with shared client factories and auth helpers on first use), local dev setup, Google auth, generated types, `.env.example` entries.
5. `add-db-table`: migration in the app's `supabase/`, RLS + policies, regenerate types, add a test.
6. `promote-to-package`: when a second app needs code, move it to a package, update both apps, keep all checks green.
7. `kill-project`: fill in the brief's outcome and lessons, set status to killed in `portfolio.md`, remove `apps/<slug>/` and its analytics section in a single PR, and list the external resources I must delete by hand (Vercel project, Supabase project, domain renewal).
8. `fix-failing-check`: reproduce locally, fix the root cause, never skip or weaken checks.
9. `log-harness-lesson`: add a row to `harness-log.md` and propose the matching harness fix.

## Phase 6 — Wire up project #1
- PostHog: tell me which keys to add to `apps/<slug>/.env.local` and to the app's Vercel project.
- If the brief requires data or logins, run the `add-backend` skill for this app.
- Tell me the exact Vercel setup: new project from this repo, root directory `apps/<slug>`, build skip setting, env vars.

## Phase 7 — Verify and report
Report pass/fail on each item:
- [ ] `pnpm check` passes locally; CI passes on a test PR.
- [ ] `pnpm new-project test-scaffold` creates a working app that passes checks; then remove it cleanly.
- [ ] Importing one app from another fails lint with a helpful message.
- [ ] Importing server code into a client component fails lint with a helpful message.
- [ ] A PR touching only `apps/<slug>` runs checks only for that app and its dependencies.
- [ ] Root AGENTS.md is about 100 lines or fewer; each CLAUDE.md imports its AGENTS.md.
- [ ] Deny rules work: `.env.local` cannot be read; `.env.example` can.
- [ ] A PostHog test event with the correct `app` property fires (I'll confirm in the dashboard).
- [ ] (If a backend exists) The RLS check fails on a migration that lacks RLS.
- [ ] README has a 10-line quickstart a future teammate could follow.
- [ ] A list of anything you couldn't complete, and why.

# 0001 — Stack

- **Status:** accepted (2026-09-25)
- **Context:** A solo founder launching many small products fast, with agents writing most of
  the code. The stack must be boring, well-documented (agents know it), cheap at zero traffic,
  and machine-checkable.

## Decision

| Concern                  | Choice                                                                      | Why                                                             |
| ------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Language                 | TypeScript, `strict` + `noUncheckedIndexedAccess`                           | Types catch agent mistakes before runtime                       |
| Runtime                  | Node LTS (24), pinned in `.nvmrc` + `engines`                               | One version everywhere: local, CI, Vercel                       |
| App framework            | Next.js (App Router, `src/`)                                                | Full-stack in one app; first-class on Vercel                    |
| UI                       | Tailwind CSS v4 + shadcn/ui in `packages/ui`                                | Copy-owned components; fast, consistent styling                 |
| Validation               | Zod at every boundary                                                       | One schema gives runtime checks and types                       |
| Lint/format              | ESLint (typescript-eslint strict type-checked) + Prettier                   | Strictest mainstream baseline; custom rules encode architecture |
| Tests                    | Vitest (unit), Playwright Chromium (one smoke test per app)                 | Fast unit loop; one real-browser check of the critical path     |
| Analytics                | PostHog, one project, `app` property on every event                         | Compare products side by side; free tier covers early stage     |
| Backend (only if needed) | Supabase per app, Google auth only, SQL migrations, generated types, no ORM | Postgres + auth + RLS with no servers; SQL agents already know  |
| Hosting                  | Vercel, one project per app, root `apps/<slug>`                             | Zero-ops deploys; per-app isolation and kill-ability            |
| CI                       | GitHub Actions                                                              | Lives next to the code; free minutes cover this scale           |

Versions pinned at adoption: Next 16.3, React 19.3, TypeScript 6.0 (typescript-eslint doesn't
support 7 yet), Tailwind 4.3, Zod 4.6, Vitest 5.0, Playwright 1.63, pnpm 12, Turborepo 2.11.

## Consequences

- No other services, SaaS or paid dependencies without the human's approval.
- An app without data or logins has no backend at all (no Supabase project to pay for or kill).
- Upgrades happen in the template first, then apps (template drift check reports lagging apps).

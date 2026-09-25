---
name: kill-project
description: Shut down a project cleanly after a kill decision. Use when the human decides to kill an app. Records outcome and lessons, marks it killed, removes the app and its analytics section in one PR, and lists the external resources the human must delete.
argument-hint: "<slug>"
---

# Kill a project

## Steps

1. **Confirm** the human has decided to kill `<slug>` (don't infer it from metrics alone).
2. **Brief:** fill in `docs/briefs/<slug>.md` → "Outcome and lessons": the kill-criteria
   numbers, what we learned about the riskiest assumption, what we'd do differently. Keep the
   brief; it's the record.
3. **Portfolio:** in `docs/portfolio.md` set status `killed`, the decision date and a one-line
   outcome. Never delete the row (slugs are never reused).
4. **Remove the app:** `git rm -r apps/<slug>`; remove its section from `docs/analytics.md`;
   delete any `docs/exec-plans/active/<slug>-*` (move useful ones to `completed/`).
5. **Harness lessons:** anything the factory itself should learn goes into
   `docs/harness-log.md` (log-harness-lesson skill).
6. **Check shared packages:** if a package was only used by this app, leave it unless the human
   says to remove it.
7. **Checks:** `pnpm install` then `pnpm check`.
8. **One PR** titled `chore: kill <slug>`.
9. **Give the human the manual cleanup list:**
   - Vercel: delete the `<slug>` project (Settings → Advanced → Delete Project)
   - Supabase: pause/delete the project (export data first if needed)
   - Domain: turn off auto-renew / let it lapse; remove DNS records
   - Google OAuth client for the app (Google Cloud console), if any
   - PostHog: nothing to delete (shared project); optionally archive its dashboards

## Done checklist

- [ ] Brief has outcome and lessons; portfolio row says `killed` with dates
- [ ] `apps/<slug>` and its analytics section removed in a single PR
- [ ] `pnpm check` passes
- [ ] Manual cleanup list handed to the human

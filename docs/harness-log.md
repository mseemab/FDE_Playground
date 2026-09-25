# Harness log

Every time an agent gets something wrong, add a row and ship the matching harness fix (a lint
rule, a test, a check, a doc line or a skill step) so it can't happen the same way again. Use
the log-harness-lesson skill.

| Date       | App               | What the agent got wrong                                                                           | Root cause                                                                 | Harness fix                                                                                        |
| ---------- | ----------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 2026-09-25 | template-next-app | Smoke test asserted on `getByRole("alert")`, which also matched Next's hidden route announcer      | Next injects `role="alert"` on every page                                  | Template targets the form's own error element (`#email-error`); pattern noted for future e2e tests |
| 2026-09-25 | template-next-app | Playwright run hung after tests passed                                                             | `webServer` started via `pnpm start`, which didn't forward SIGTERM to Next | Template runs `next start` directly with `gracefulShutdown`                                        |
| 2026-09-25 | pantry-pal        | Scaffolder said "fill in the brief" when a finished brief already existed                          | Message didn't check whether the brief was pre-written                     | Scaffolder prints "Review" vs "Fill in" based on whether the brief existed                         |
| 2026-09-25 | —                 | Bash guard blocked writing a skill file via heredoc because the doc text mentioned `supabase link` | Guard parsed here-document bodies as commands                              | `stripHeredocs` in `tools/hooks/guard-bash.ts` + tests                                             |

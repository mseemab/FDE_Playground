---
name: add-analytics-event
description: Add or change a PostHog analytics event for an app. Use whenever a feature needs tracking or the brief lists a new event. Covers naming, properties, registration in the app and docs/analytics.md, and emitting it.
argument-hint: "<slug> <event_name>"
---

# Add an analytics event

## Steps

1. **Name it** `object_action` in snake_case, past tense: `item_added`, not `addItem` or
   `clicked_add`. Reuse an existing event with a property before inventing a near-duplicate.
2. **Properties:** snake_case keys; string/number/boolean/null values only. No personal data
   (emails, names, free text) and no secrets. Never set `app`; it's attached automatically.
3. **Register** the event in three places, in the same PR:
   - `docs/briefs/<slug>.md` → "Events to track" table (if not already there)
   - `apps/<slug>/src/analytics.ts` → `events` array
   - `docs/analytics.md` → the app's section (event, when, properties)
4. **Emit it:**
   - Client: `import { track } from "@/lib/track"; track("item_added", { has_expiry: true });`
   - Server (actions/route handlers): create a tracker once in `src/server/analytics.ts` with
     `createServerTracker(analytics, { apiKey: env.NEXT_PUBLIC_POSTHOG_KEY, host: env.NEXT_PUBLIC_POSTHOG_HOST })`
     and call `await captureServer("item_added", { distinctId: user.id, properties })`.
   - Fire it after the action succeeded, not before.
5. **Test:** a unit test for any logic computing properties. `pnpm check:affected`.

## Done checklist

- [ ] Name is `object_action` snake_case; properties contain no personal data
- [ ] Listed in the brief, `src/analytics.ts` and `docs/analytics.md`
- [ ] Emitted once, after success, from the right side (client or server)
- [ ] Typecheck passes (unregistered names are type errors)

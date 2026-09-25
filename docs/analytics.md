# Analytics

One PostHog project serves every app. Events are separated by the `app` property.

## Rules

- **Names:** `object_action`, snake_case, past tense action: `item_added`, `waitlist_joined`,
  `expiring_list_viewed`. Enforced by `defineAnalytics` (`packages/analytics`).
- **Required property:** `app: "<slug>"`, attached automatically by `track()` and the server
  tracker. Never set it by hand.
- **Other properties:** snake_case; values are strings, numbers, booleans or null. No personal
  data (emails, names, free text), no secrets.
- **Registration:** an event must be listed in the app's brief, in `apps/<slug>/src/analytics.ts`
  and in this file before code emits it. Unregistered events fail typecheck and throw at runtime.
- **Where to track:** client events with `track()` from `@/lib/track`; server-side events with
  `createServerTracker()` from `@factory/analytics/server` (needs a `distinctId`).

## Events per app

### template-next-app

| Event             | When                                  | Properties |
| ----------------- | ------------------------------------- | ---------- |
| `waitlist_joined` | Landing page waitlist signup succeeds | —          |

### pantry-pal

Brief: [briefs/pantry-pal.md](briefs/pantry-pal.md). Registered in `apps/pantry-pal/src/analytics.ts`
as features ship (Phase 6 of the factory setup adds the backend-driven ones).

| Event                  | When                               | Properties                                              |
| ---------------------- | ---------------------------------- | ------------------------------------------------------- |
| `waitlist_joined`      | Landing page signup succeeds       | —                                                       |
| `user_signed_in`       | Google sign-in completes           | `first_time: boolean`                                   |
| `item_added`           | A pantry item is saved             | `has_expiry: boolean`, `days_to_expiry: number \| null` |
| `item_used`            | An item is marked as used          | `days_before_expiry: number \| null`                    |
| `item_discarded`       | An item is marked as thrown away   | `days_after_expiry: number \| null`                     |
| `expiring_list_viewed` | The "expiring soon" list is opened | `item_count: number`                                    |

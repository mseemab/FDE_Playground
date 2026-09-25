# Brief: pantry-pal

> Created 2026-09-25. Sample project #1 for the factory (invented to exercise the full stack:
> logins, data, RLS, analytics). Status lives in [docs/portfolio.md](../portfolio.md).

## Target user

Busy people in 1–2 person households who cook at home a few times a week and regularly throw
out food they forgot they had.

## Problem

Food gets bought, pushed to the back of the fridge or pantry, and found after it has expired.
People cope with memory, sticky notes or not at all; generic inventory apps are too much effort
to keep updated, so they're abandoned within a week.

## Riskiest assumption

People will log groceries within a day of buying them if adding an item takes under 10 seconds
(name + rough expiry, no barcodes). If they won't log, nothing else matters.

## First 50 users

- 15 from my own network (friends and colleagues who cook), invited personally.
- 20 from r/EatCheapAndHealthy and r/MealPrepSunday via a "how I stopped wasting food" post.
- 15 from two local zero-waste community groups (post in their channels; ask admins first).

## Core action (definition of "activated")

Added 5 or more pantry items within 7 days of signing up **and** came back on a later day to view
the "expiring soon" list.

## Events to track

Every event also gets `app: "pantry-pal"` automatically. Registered in
`apps/pantry-pal/src/analytics.ts` and `docs/analytics.md`.

| Event                  | When it fires                            | Properties                                              |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `waitlist_joined`      | Landing page signup succeeds             | —                                                       |
| `user_signed_in`       | Google sign-in completes                 | `first_time: boolean`                                   |
| `item_added`           | A pantry item is saved                   | `has_expiry: boolean`, `days_to_expiry: number \| null` |
| `item_used`            | An item is marked as used (cooked/eaten) | `days_before_expiry: number \| null`                    |
| `item_discarded`       | An item is marked as thrown away         | `days_after_expiry: number \| null`                     |
| `expiring_list_viewed` | The "expiring soon" list is opened       | `item_count: number`                                    |

## Kill criteria (measured after 4 weeks live)

Kill if any of these is true 4 weeks after launch:

- Fewer than 50 signups.
- Fewer than 30% of signups are activated (core action above).
- Fewer than 15% of activated users are still adding items in week 4.

## Cut list

- Barcode scanning, receipt OCR, grocery-store integrations.
- Recipes or meal suggestions.
- Shared households / multiple users per pantry.
- Push or email notifications (v1 relies on users opening the app).
- Native mobile apps (responsive web only).

## Launch date

TBD — target 3 weeks after the factory setup is complete.

## Outcome and lessons

_Filled in at the keep/kill decision._

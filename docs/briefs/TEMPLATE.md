# Brief: **SLUG**

> Created **DATE**. Fill in every section before feature work starts. Keep it short: this is a
> bet, not a spec. Status lives in [docs/portfolio.md](../portfolio.md).

## Target user

_Who exactly, in one sentence. Specific enough to find 50 of them._

## Problem

_What hurts today, and how they cope without this product._

## Riskiest assumption

_The one belief that, if wrong, kills the project. Build to test this first._

## First 50 users

_Who they are and exactly how I'll reach them (communities, lists, people by name)._

## Core action (definition of "activated")

_The single action that means a user got value, e.g. "added 5 items within 7 days of signup"._

## Events to track

_snake_case `object_action` names, each with the properties it carries. Every event also gets
`app: "__SLUG__"` automatically. Register them in `apps/__SLUG__/src/analytics.ts` and
`docs/analytics.md`._

| Event             | When it fires                | Properties |
| ----------------- | ---------------------------- | ---------- |
| `waitlist_joined` | Landing page signup succeeds | —          |

## Kill criteria (measured after 4 weeks live)

_Numeric thresholds. If they aren't met, the project is killed (see the kill-project skill)._

## Cut list

_Things explicitly NOT in v1._

## Launch date

_Target date._

## Outcome and lessons

_Filled in at the keep/kill decision._

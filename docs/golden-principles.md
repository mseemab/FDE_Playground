# Golden principles

Short rules with one example each. When a rule and the code disagree, fix the code or propose a
change to this file in the same PR.

## Errors

Expected failures are values; unexpected ones throw. Server actions return a typed state instead
of throwing for user errors.

```ts
const parsed = schema.safeParse(input);
if (!parsed.success)
  return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
```

Never swallow errors: no empty `catch {}`. If you catch, either handle it or rethrow with context.

## Validation

Parse, don't trust. Every boundary uses a Zod schema, and types come from the schema.

```ts
export const itemSchema = z.object({
  name: z.string().min(1).max(80),
  expiresOn: z.iso.date().nullable(),
});
export type ItemInput = z.infer<typeof itemSchema>;
```

## Naming

- Files: `kebab-case.ts(x)`. Components: `PascalCase`. Functions/variables: `camelCase`.
- Analytics events: `object_action` in snake_case (`item_added`), see `docs/analytics.md`.
- DB tables and columns: `snake_case`, plural tables (`pantry_items`).
- App slugs: kebab-case (`pantry-pal`); package names `@apps/<slug>` and `@factory/<name>`.

## Logging

Log events, not data. Never log secrets, tokens, emails or other personal data.

```ts
console.info("[waitlist] signup received"); // not: console.info(`signup ${email}`)
```

Prefix messages with a `[area]` tag so logs are searchable in Vercel.

## Components

- Server components by default. Add `"use client"` only for state, effects or browser APIs, and
  keep client components small (leaf components, not whole pages).
- Data loading happens on the server; pass plain props down.
- Use `@factory/ui` primitives before writing new ones; extend with `className`, not forks.

```tsx
<Button variant="outline" className="w-full">
  Save
</Button>
```

## Design (per-app look)

Design changes go in the app first. Override theme tokens in the app's `src/app/globals.css`
(colours, radius, fonts, new `@theme` tokens) and put app-specific components in
`src/components/`. Change `packages/ui` only when every app should get the change.

```css
/* apps/pantry-pal/src/app/globals.css */
:root {
  --primary: oklch(0.55 0.18 150);
  --radius: 1rem;
}
```

## Tests

- Unit-test schemas, pure helpers and anything with branches (Vitest, next to the file).
- One Playwright smoke test per app covers the critical path only.
- A bug fix comes with a test that fails without the fix.

## Dependencies

Prefer the platform and existing packages. A new dependency needs a reason in the PR; a new
service or anything paid needs the human's approval first.

import { z } from "zod";

/**
 * Environment variables, validated with Zod at startup (imported by next.config.ts).
 * Public (NEXT_PUBLIC_*) values must be read with literal `process.env.X` so Next can inline
 * them into the client bundle. Add every new variable here AND to .env.example.
 */

/** Values of the local Supabase stack (`pnpm db:start`); identical on every machine, not secret. */
const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const LOCAL_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

const publicSchema = z
  .object({
    NEXT_PUBLIC_POSTHOG_KEY: z.string().startsWith("phc_").optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.url().default("https://us.i.posthog.com"),
    NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20).optional(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  })
  .superRefine((env, ctx) => {
    const deployed = env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview";
    if (env.VERCEL_ENV === "production" && env.NEXT_PUBLIC_POSTHOG_KEY === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_POSTHOG_KEY"],
        message: "NEXT_PUBLIC_POSTHOG_KEY is required in production",
      });
    }
    for (const key of [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ] as const) {
      if (deployed && env[key] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required on Vercel (${String(env.VERCEL_ENV)})`,
        });
      }
    }
  })
  .transform((env) => ({
    ...env,
    // Local dev and CI default to the local Supabase stack; Vercel must set real values.
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL ?? LOCAL_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? LOCAL_SUPABASE_PUBLISHABLE_KEY,
  }));

export type PublicEnv = z.infer<typeof publicSchema>;

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  // Treat empty strings (e.g. `KEY=` copied from .env.example) as unset.
  const cleaned = Object.fromEntries(
    Object.entries(source).map(([k, v]) => [k, v === "" ? undefined : v]),
  );
  const result = publicSchema.safeParse(cleaned);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const env = parsePublicEnv({
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  VERCEL_ENV: process.env.VERCEL_ENV,
});

export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

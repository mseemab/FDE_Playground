import { z } from "zod";

/**
 * Environment variables, validated with Zod at startup (imported by next.config.ts).
 * Public (NEXT_PUBLIC_*) values must be read with literal `process.env.X` so Next can inline
 * them into the client bundle. Add every new variable here AND to .env.example.
 */

const publicSchema = z
  .object({
    NEXT_PUBLIC_POSTHOG_KEY: z.string().startsWith("phc_").optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.url().default("https://us.i.posthog.com"),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  })
  .refine((env) => env.VERCEL_ENV !== "production" || env.NEXT_PUBLIC_POSTHOG_KEY !== undefined, {
    message: "NEXT_PUBLIC_POSTHOG_KEY is required in production",
    path: ["NEXT_PUBLIC_POSTHOG_KEY"],
  });

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
  VERCEL_ENV: process.env.VERCEL_ENV,
});

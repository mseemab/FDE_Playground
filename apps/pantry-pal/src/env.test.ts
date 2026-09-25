import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

describe("parsePublicEnv", () => {
  it("defaults PostHog host and the local Supabase stack outside Vercel", () => {
    expect(parsePublicEnv({ NEXT_PUBLIC_POSTHOG_KEY: "" })).toEqual({
      NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
    });
  });

  it("requires the PostHog key in production", () => {
    expect(() =>
      parsePublicEnv({
        VERCEL_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_xxxxxxxxxxxxxxxxxxxx",
      }),
    ).toThrow(/NEXT_PUBLIC_POSTHOG_KEY/);
  });

  it("requires real Supabase settings on Vercel previews and production", () => {
    expect(() => parsePublicEnv({ VERCEL_ENV: "preview" })).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("rejects a malformed PostHog key", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_POSTHOG_KEY: "sk_live" })).toThrow();
  });
});

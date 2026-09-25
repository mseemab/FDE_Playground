import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

describe("parsePublicEnv", () => {
  it("allows a missing PostHog key outside production and defaults the host", () => {
    expect(parsePublicEnv({ NEXT_PUBLIC_POSTHOG_KEY: "" })).toEqual({
      NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
    });
  });

  it("requires the PostHog key in production", () => {
    expect(() => parsePublicEnv({ VERCEL_ENV: "production" })).toThrow(/NEXT_PUBLIC_POSTHOG_KEY/);
  });

  it("rejects a malformed key", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_POSTHOG_KEY: "sk_live" })).toThrow();
  });
});

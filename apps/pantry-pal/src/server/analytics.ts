import "server-only";
import { createServerTracker } from "@factory/analytics/server";
import { analytics } from "@/analytics";
import { env } from "@/env";

/** Typed server-side capture for actions and route handlers (no-op without a PostHog key). */
export const captureServer = createServerTracker(analytics, {
  apiKey: env.NEXT_PUBLIC_POSTHOG_KEY,
  host: env.NEXT_PUBLIC_POSTHOG_HOST,
});

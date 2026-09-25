import "server-only";
import { PostHog } from "posthog-node";
import { buildEvent, type AnalyticsConfig, type EventProperties } from "./index";

interface ServerTrackerOptions {
  /** PostHog project API key. When absent (local dev, CI), capture is a no-op. */
  apiKey: string | undefined;
  host: string;
  /** Injected in tests; defaults to a real posthog-node client. */
  client?: Pick<PostHog, "captureImmediate">;
}

/**
 * Returns a typed server-side `captureServer(event, { distinctId, properties })` for route
 * handlers and server actions. Uses `captureImmediate` so events are sent before a serverless
 * function returns.
 */
export function createServerTracker<E extends string>(
  config: AnalyticsConfig<E>,
  { apiKey, host, client }: ServerTrackerOptions,
) {
  const posthog = client ?? (apiKey ? new PostHog(apiKey, { host }) : undefined);
  return async function captureServer(
    event: NoInfer<E>,
    { distinctId, properties }: { distinctId: string; properties?: EventProperties },
  ): Promise<void> {
    const payload = buildEvent(config, event, properties);
    if (!posthog) return;
    await posthog.captureImmediate({ distinctId, ...payload });
  };
}

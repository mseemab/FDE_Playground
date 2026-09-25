"use client";

import posthog from "posthog-js";
import { useEffect, type ReactNode } from "react";
import { buildEvent, type AnalyticsConfig, type EventProperties } from "./index";

interface AnalyticsProviderProps {
  app: string;
  /** PostHog project API key. When absent (local dev, CI), analytics is disabled. */
  apiKey: string | undefined;
  apiHost: string;
  children: ReactNode;
}

/** Initialises PostHog once in the browser. Render it in the app's root layout. */
export function AnalyticsProvider({ app, apiKey, apiHost, children }: AnalyticsProviderProps) {
  useEffect(() => {
    if (!apiKey || posthog.__loaded) return;
    posthog.init(apiKey, { api_host: apiHost, person_profiles: "identified_only" });
    posthog.register({ app });
  }, [app, apiKey, apiHost]);
  return children;
}

/** Returns a typed `track(event, props)` for client components. No-op until PostHog is loaded. */
export function createTracker<E extends string>(config: AnalyticsConfig<E>) {
  return function track(event: NoInfer<E>, properties?: EventProperties): void {
    const payload = buildEvent(config, event, properties);
    if (!posthog.__loaded) return;
    posthog.capture(payload.event, payload.properties);
  };
}

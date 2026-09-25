import { z } from "zod";

/**
 * Shared, environment-neutral analytics core. Every app registers its slug and the exact list of
 * events it may emit (see docs/analytics.md); `track` only accepts those names and always
 * attaches `app`.
 */

export const eventNameSchema = z
  .string()
  .regex(/^[a-z]+(_[a-z]+)+$/, "Event names are snake_case object_action, e.g. waitlist_joined");

export const appSlugSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, "App slugs are kebab-case, e.g. pantry-pal");

export type EventProperties = Record<string, string | number | boolean | null>;

export interface AnalyticsConfig<E extends string> {
  readonly app: string;
  readonly events: readonly E[];
}

export type EventOf<C> = C extends AnalyticsConfig<infer E> ? E : never;

export interface AnalyticsEvent {
  event: string;
  properties: EventProperties & { app: string };
}

/** Registers an app's slug and allowed events. Throws on invalid names so typos fail fast. */
export function defineAnalytics<const E extends string>(config: {
  app: string;
  events: readonly E[];
}): AnalyticsConfig<E> {
  appSlugSchema.parse(config.app);
  for (const event of config.events) eventNameSchema.parse(event);
  return { app: config.app, events: [...config.events] };
}

/** Builds the payload sent to PostHog. `app` always wins over a caller-supplied `app` property. */
export function buildEvent<E extends string>(
  config: AnalyticsConfig<E>,
  event: NoInfer<E>,
  properties: EventProperties = {},
): AnalyticsEvent {
  if (!config.events.includes(event)) {
    throw new Error(
      `Unknown analytics event "${event}" for app "${config.app}". ` +
        `Register it in the app's src/analytics.ts and docs/analytics.md first.`,
    );
  }
  return { event, properties: { ...properties, app: config.app } };
}

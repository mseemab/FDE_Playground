import { defineAnalytics } from "@factory/analytics";

/**
 * This app's analytics registration. Only events listed here can be tracked, and every event
 * carries `app: "pantry-pal"`. Keep this list in sync with the brief and docs/analytics.md.
 */
export const analytics = defineAnalytics({
  app: "pantry-pal",
  events: ["waitlist_joined"],
});

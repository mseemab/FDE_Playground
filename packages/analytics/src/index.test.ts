import { describe, expect, it, vi } from "vitest";
import { buildEvent, defineAnalytics } from "./index";
import { createServerTracker } from "./server";

const analytics = defineAnalytics({ app: "pantry-pal", events: ["waitlist_joined", "item_added"] });

describe("defineAnalytics", () => {
  it("rejects slugs that are not kebab-case", () => {
    expect(() => defineAnalytics({ app: "Pantry Pal", events: ["item_added"] })).toThrow();
  });

  it("rejects event names that are not snake_case object_action", () => {
    expect(() => defineAnalytics({ app: "pantry-pal", events: ["ItemAdded"] })).toThrow();
  });
});

describe("buildEvent", () => {
  it("always attaches the app slug, overriding any caller value", () => {
    const payload = buildEvent(analytics, "item_added", { app: "other", count: 2 });
    expect(payload).toEqual({ event: "item_added", properties: { app: "pantry-pal", count: 2 } });
  });

  it("rejects events that are not registered", () => {
    // @ts-expect-error - unregistered events are also a type error
    expect(() => buildEvent(analytics, "item_deleted")).toThrow(/Unknown analytics event/);
  });
});

describe("createServerTracker", () => {
  it("captures with the app property and distinct id", async () => {
    const captureImmediate = vi.fn().mockResolvedValue(undefined);
    const capture = createServerTracker(analytics, {
      apiKey: "phc_test",
      host: "https://us.i.posthog.com",
      client: { captureImmediate },
    });
    await capture("waitlist_joined", { distinctId: "user-1" });
    expect(captureImmediate).toHaveBeenCalledWith({
      distinctId: "user-1",
      event: "waitlist_joined",
      properties: { app: "pantry-pal" },
    });
  });

  it("is a no-op without an API key", async () => {
    const capture = createServerTracker(analytics, { apiKey: undefined, host: "https://x.test" });
    await expect(capture("waitlist_joined", { distinctId: "u" })).resolves.toBeUndefined();
  });
});

"use client";

import { createTracker } from "@factory/analytics/client";
import { analytics } from "@/analytics";

/** Typed client-side `track(event, props)` for this app. */
export const track = createTracker(analytics);

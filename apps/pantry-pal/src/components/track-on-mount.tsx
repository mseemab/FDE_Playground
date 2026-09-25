"use client";

import type { EventProperties } from "@factory/analytics";
import { useEffect, useRef } from "react";
import type { analytics } from "@/analytics";
import { track } from "@/lib/track";

type Event = (typeof analytics.events)[number];

/** Fires a client-side event once per mount (e.g. a list being viewed). */
export function TrackOnMount({
  event,
  properties,
}: {
  event: Event;
  properties?: EventProperties;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(event, properties);
  }, [event, properties]);
  return null;
}

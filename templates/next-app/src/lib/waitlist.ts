import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.email("Enter a valid email address").max(254),
});

export type WaitlistState =
  { status: "idle" } | { status: "success" } | { status: "error"; message: string };

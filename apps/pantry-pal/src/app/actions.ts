"use server";

import { waitlistSchema, type WaitlistState } from "@/lib/waitlist";
import { addToWaitlist } from "@/server/waitlist";

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = waitlistSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await addToWaitlist(parsed.data.email);
  return { status: "success" };
}

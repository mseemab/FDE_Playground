"use server";

import { revalidatePath } from "next/cache";
import { addItemSchema, daysUntil, isoToday, markItemSchema, type FormState } from "@/lib/pantry";
import { captureServer } from "@/server/analytics";
import { getSupabase, requireUser } from "@/server/supabase";

export async function addItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = addItemSchema.safeParse({
    name: formData.get("name"),
    expiresOn: formData.get("expiresOn") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("pantry_items")
    .insert({ name: parsed.data.name, expires_on: parsed.data.expiresOn });
  if (error) {
    console.error("[pantry] insert failed", error.code);
    return { status: "error", message: "Couldn't save that item. Try again." };
  }

  await captureServer("item_added", {
    distinctId: user.id,
    properties: {
      has_expiry: parsed.data.expiresOn !== null,
      days_to_expiry: daysUntil(parsed.data.expiresOn, isoToday()),
    },
  });
  revalidatePath("/pantry");
  return { status: "success" };
}

export async function markItem(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = markItemSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const supabase = await getSupabase();
  // RLS limits the update to the user's own rows; `in_pantry` guards against double-marking.
  const { data, error } = await supabase
    .from("pantry_items")
    .update({ status: parsed.data.status, status_changed_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("status", "in_pantry")
    .select("expires_on")
    .maybeSingle();
  if (error) {
    console.error("[pantry] update failed", error.code);
    return;
  }
  if (!data) return;

  const days = daysUntil(data.expires_on, isoToday());
  if (parsed.data.status === "used") {
    await captureServer("item_used", {
      distinctId: user.id,
      properties: { days_before_expiry: days },
    });
  } else {
    await captureServer("item_discarded", {
      distinctId: user.id,
      properties: { days_after_expiry: days === null ? null : -days },
    });
  }
  revalidatePath("/pantry");
}

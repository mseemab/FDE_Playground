import { z } from "zod";
import type { Database } from "./database.types";

export type PantryItem = Database["public"]["Tables"]["pantry_items"]["Row"];
export type PantryItemStatus = Database["public"]["Enums"]["pantry_item_status"];

/** Items expiring within this many days (or already expired) show in "Expiring soon". */
export const EXPIRING_SOON_DAYS = 3;

export const addItemSchema = z.object({
  name: z.string().trim().min(1, "Give the item a name").max(80, "Keep it under 80 characters"),
  expiresOn: z
    .union([z.literal(""), z.iso.date("Pick a valid date")])
    .optional()
    .transform((v) => (v ? v : null)),
});
export type AddItemInput = z.infer<typeof addItemSchema>;

export const markItemSchema = z.object({
  id: z.uuid(),
  status: z.enum(["used", "discarded"]),
});

export type FormState =
  { status: "idle" } | { status: "success" } | { status: "error"; message: string };

/** Today's date as YYYY-MM-DD (UTC; good enough for day-level expiry in v1). */
export function isoToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Whole days from `today` to `date` (negative when `date` is in the past); null without a date. */
export function daysUntil(date: string | null, today: string): number | null {
  if (!date) return null;
  const ms = Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function isExpiringSoon(item: Pick<PantryItem, "expires_on">, today: string): boolean {
  const days = daysUntil(item.expires_on, today);
  return days !== null && days <= EXPIRING_SOON_DAYS;
}

/** Splits in-pantry items into "expiring soon" (soonest first) and the rest (by expiry, then name). */
export function splitPantry<T extends Pick<PantryItem, "expires_on" | "name">>(
  items: readonly T[],
  today: string,
) {
  const byExpiry = (a: T, b: T) =>
    (a.expires_on ?? "9999-12-31").localeCompare(b.expires_on ?? "9999-12-31") ||
    a.name.localeCompare(b.name);
  const sorted = [...items].sort(byExpiry);
  return {
    expiringSoon: sorted.filter((i) => isExpiringSoon(i, today)),
    rest: sorted.filter((i) => !isExpiringSoon(i, today)),
  };
}

/** Human label for an expiry date relative to today. */
export function expiryLabel(date: string | null, today: string): string {
  const days = daysUntil(date, today);
  if (days === null) return "No expiry date";
  if (days < -1) return `Expired ${String(-days)} days ago`;
  if (days === -1) return "Expired yesterday";
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${String(days)} days`;
}

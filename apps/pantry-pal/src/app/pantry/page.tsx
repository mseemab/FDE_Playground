import { Button } from "@factory/ui/components/button";
import { Card, CardContent } from "@factory/ui/components/card";
import type { Metadata } from "next";
import { AddItemForm } from "@/components/add-item-form";
import { TrackOnMount } from "@/components/track-on-mount";
import { expiryLabel, isExpiringSoon, isoToday, splitPantry, type PantryItem } from "@/lib/pantry";
import { getSupabase, requireUser } from "@/server/supabase";
import { signOut } from "../auth/actions";
import { markItem } from "./actions";

export const metadata: Metadata = { title: "Your pantry" };

export default async function PantryPage() {
  const user = await requireUser();
  const supabase = await getSupabase();
  const { data: items, error } = await supabase
    .from("pantry_items")
    .select("id, name, expires_on")
    .eq("status", "in_pantry")
    .order("expires_on", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`[pantry] load failed: ${error.code}`);

  const today = isoToday();
  const { expiringSoon, rest } = splitPantry(items, today);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Your pantry</h1>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit" title={user.email ?? undefined}>
            Sign out
          </Button>
        </form>
      </header>

      <Card>
        <CardContent>
          <AddItemForm />
        </CardContent>
      </Card>

      <section aria-labelledby="expiring-heading" className="flex flex-col gap-3">
        <h2 id="expiring-heading" className="text-xl font-semibold">
          Expiring soon
        </h2>
        <TrackOnMount
          event="expiring_list_viewed"
          properties={{ item_count: expiringSoon.length }}
        />
        {expiringSoon.length === 0 ? (
          <p className="text-muted-foreground">Nothing expiring in the next 3 days.</p>
        ) : (
          <ItemList items={expiringSoon} today={today} />
        )}
      </section>

      <section aria-labelledby="rest-heading" className="flex flex-col gap-3">
        <h2 id="rest-heading" className="text-xl font-semibold">
          Everything else
        </h2>
        {rest.length === 0 ? (
          <p className="text-muted-foreground">Add what you just bought: it takes seconds.</p>
        ) : (
          <ItemList items={rest} today={today} />
        )}
      </section>
    </main>
  );
}

function ItemList({
  items,
  today,
}: {
  items: Pick<PantryItem, "id" | "name" | "expires_on">[];
  today: string;
}) {
  return (
    <Card className="py-2">
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-6 py-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{item.name}</span>
              <span
                className={
                  isExpiringSoon(item, today)
                    ? "text-destructive text-sm"
                    : "text-muted-foreground text-sm"
                }
              >
                {expiryLabel(item.expires_on, today)}
              </span>
            </div>
            <form action={markItem} className="flex shrink-0 gap-2">
              <input type="hidden" name="id" value={item.id} />
              <Button type="submit" name="status" value="used" size="sm" variant="secondary">
                Used
              </Button>
              <Button type="submit" name="status" value="discarded" size="sm" variant="outline">
                Tossed
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </Card>
  );
}

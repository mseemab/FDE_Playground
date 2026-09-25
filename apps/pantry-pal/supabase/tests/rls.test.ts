import { execFileSync } from "node:child_process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../src/lib/database.types";

/**
 * Proves pantry_items RLS against the real local database: each user sees and changes only
 * their own rows, and anonymous clients see nothing.
 */

interface LocalStatus {
  API_URL: string;
  PUBLISHABLE_KEY: string;
  SECRET_KEY: string;
}

const status = JSON.parse(
  execFileSync("pnpm", ["exec", "supabase", "status", "-o", "json"], {
    cwd: new URL("../..", import.meta.url).pathname,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
) as LocalStatus;

const admin = createClient<Database>(status.API_URL, status.SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function signedInClient(
  email: string,
): Promise<{ client: SupabaseClient<Database>; id: string }> {
  const password = `pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const client = createClient<Database>(status.API_URL, status.PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return { client, id: data.user.id };
}

const run = crypto.randomUUID().slice(0, 8);
let alice: Awaited<ReturnType<typeof signedInClient>>;
let bob: Awaited<ReturnType<typeof signedInClient>>;
let aliceItemId: string;

beforeAll(async () => {
  alice = await signedInClient(`alice-${run}@example.test`);
  bob = await signedInClient(`bob-${run}@example.test`);
  const { data, error } = await alice.client
    .from("pantry_items")
    .insert({ name: "Alice's milk", expires_on: "2026-10-01" })
    .select("id, user_id")
    .single();
  if (error) throw error;
  expect(data.user_id).toBe(alice.id); // user_id defaults to auth.uid()
  aliceItemId = data.id;
});

afterAll(async () => {
  for (const user of [alice, bob]) await admin.auth.admin.deleteUser(user.id); // cascades to items
});

describe("pantry_items RLS", () => {
  it("lets the owner read their items", async () => {
    const { data } = await alice.client.from("pantry_items").select("id");
    expect(data?.map((r) => r.id)).toContain(aliceItemId);
  });

  it("hides other users' items", async () => {
    const { data, error } = await bob.client
      .from("pantry_items")
      .select("id")
      .eq("id", aliceItemId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("hides everything from anonymous clients", async () => {
    const anon = createClient<Database>(status.API_URL, status.PUBLISHABLE_KEY, {
      auth: { persistSession: false },
    });
    const { data } = await anon.from("pantry_items").select("id");
    expect(data).toEqual([]);
  });

  it("stops users inserting rows owned by someone else", async () => {
    const { error } = await bob.client
      .from("pantry_items")
      .insert({ name: "Planted", user_id: alice.id });
    expect(error?.code).toBe("42501"); // insufficient_privilege: RLS with check failed
  });

  it("stops users updating other users' items", async () => {
    const { data } = await bob.client
      .from("pantry_items")
      .update({ status: "discarded" })
      .eq("id", aliceItemId)
      .select("id");
    expect(data).toEqual([]);
    const { data: still } = await alice.client
      .from("pantry_items")
      .select("status")
      .eq("id", aliceItemId)
      .single();
    expect(still?.status).toBe("in_pantry");
  });

  it("stops users moving their items to someone else", async () => {
    const { data: own } = await bob.client
      .from("pantry_items")
      .insert({ name: "Bob's eggs" })
      .select("id")
      .single();
    const { error } = await bob.client
      .from("pantry_items")
      .update({ user_id: alice.id })
      .eq("id", own?.id ?? "");
    expect(error?.code).toBe("42501");
  });

  it("has no delete policy (items are marked used/discarded instead)", async () => {
    const { data } = await alice.client
      .from("pantry_items")
      .delete()
      .eq("id", aliceItemId)
      .select("id");
    expect(data).toEqual([]);
  });
});

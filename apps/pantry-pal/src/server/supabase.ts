import "server-only";
import { createServerSupabase, getUser, type SessionUser } from "@factory/supabase/server";
import { redirect } from "next/navigation";
import { supabaseConfig } from "@/env";
import type { Database } from "@/lib/database.types";

/** Per-request Supabase client scoped to the signed-in user (RLS applies). */
export function getSupabase() {
  return createServerSupabase<Database>(supabaseConfig);
}

/** The verified signed-in user, or null. */
export async function currentUser(): Promise<SessionUser | null> {
  return getUser(await getSupabase());
}

/** The verified signed-in user; redirects to the landing page otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
}

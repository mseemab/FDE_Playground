"use server";

import { redirect } from "next/navigation";
import { getSupabase } from "@/server/supabase";

export async function signOut(): Promise<void> {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
  redirect("/");
}

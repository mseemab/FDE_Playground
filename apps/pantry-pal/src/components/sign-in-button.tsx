"use client";

import { createBrowserSupabase } from "@factory/supabase";
import { Button } from "@factory/ui/components/button";
import { useState } from "react";
import { supabaseConfig } from "@/env";

export function SignInButton({ next = "/pantry" }: { next?: string }) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    const supabase = createBrowserSupabase(supabaseConfig);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setPending(false);
  }

  return (
    <Button size="lg" onClick={() => void signIn()} disabled={pending}>
      {pending ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}

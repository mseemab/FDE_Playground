import { createAuthCallbackHandler } from "@factory/supabase/server";
import { supabaseConfig } from "@/env";
import { captureServer } from "@/server/analytics";

/** Google OAuth lands here; exchanges the code for a session and records the sign-in. */
export const GET = createAuthCallbackHandler(supabaseConfig, {
  onSignIn: async (user) => {
    // A user's first sign-in happens within seconds of the account being created.
    const firstTime = Date.now() - Date.parse(user.created_at) < 60_000;
    await captureServer("user_signed_in", {
      distinctId: user.id,
      properties: { first_time: firstTime },
    });
  },
});

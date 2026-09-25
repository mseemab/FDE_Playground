import { updateSession } from "@factory/supabase/proxy";
import type { NextRequest } from "next/server";
import { supabaseConfig } from "@/env";

/** Refreshes the Supabase session on every request and guards signed-in pages. */
export async function proxy(request: NextRequest) {
  return updateSession(request, {
    ...supabaseConfig,
    protectedPaths: ["/pantry"],
    signInPath: "/",
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

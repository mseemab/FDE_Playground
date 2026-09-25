import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath, type SupabaseConfig } from "./index";

/**
 * Server client for server components, server actions and route handlers. Create one per
 * request; never cache it in module scope.
 */
export async function createServerSupabase<Database = unknown>({
  url,
  publishableKey,
}: SupabaseConfig) {
  const cookieStore = await cookies();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet)
            cookieStore.set(name, value, options);
        } catch {
          // Called from a server component, where cookies are read-only. The proxy
          // (src/proxy.ts) refreshes the session on every request, so this is safe to ignore.
        }
      },
    },
  });
}

export interface SessionUser {
  id: string;
  email: string | null;
}

/**
 * The signed-in user from a *verified* JWT (`getClaims()` checks the signature), or null.
 * Never trust `getSession()` on the server: its data comes from an unverified cookie.
 */
export async function getUser(supabase: Pick<SupabaseClient, "auth">): Promise<SessionUser | null> {
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
}

/**
 * Route handler for `/auth/callback`: exchanges the OAuth code for a session and redirects to
 * `?next=` (same-origin only). `onSignIn` runs after a successful exchange (e.g. analytics).
 */
export function createAuthCallbackHandler(
  config: SupabaseConfig,
  options: {
    errorPath?: string;
    onSignIn?: (user: {
      id: string;
      created_at: string;
      last_sign_in_at?: string | undefined;
    }) => Promise<void>;
  } = {},
) {
  return async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = safeRedirectPath(searchParams.get("next"));
    const errorUrl = `${origin}${options.errorPath ?? "/"}?auth_error=1`;
    if (!code) return NextResponse.redirect(errorUrl);

    const supabase = await createServerSupabase(config);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(errorUrl);
    await options.onSignIn?.(data.user);
    return NextResponse.redirect(`${origin}${next}`);
  };
}

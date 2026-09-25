import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { matchesPath, type SupabaseConfig } from "./index";

interface UpdateSessionOptions extends SupabaseConfig {
  /** Path prefixes that require a signed-in user; others are public. */
  protectedPaths: readonly string[];
  /** Where signed-out users are sent when they hit a protected path. */
  signInPath: string;
}

/**
 * Refreshes the Supabase session cookie on every request (call it from the app's `src/proxy.ts`)
 * and redirects signed-out users away from protected paths.
 */
export async function updateSession(
  request: NextRequest,
  { url, publishableKey, protectedPaths, signInPath }: UpdateSessionOptions,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet)
          response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Keep getClaims() immediately after creating the client: it refreshes the session. Running
  // other code in between can cause random sign-outs.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && matchesPath(request.nextUrl.pathname, protectedPaths)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = signInPath;
    redirectUrl.search = "";
    const redirect = NextResponse.redirect(redirectUrl);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  return response;
}

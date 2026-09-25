import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-safe entry point. Server helpers live in `@factory/supabase/server` and the session
 * refresh for `src/proxy.ts` in `@factory/supabase/proxy`.
 */

export interface SupabaseConfig {
  url: string;
  /** Publishable key (`sb_publishable_…`). Safe to expose to the browser; RLS protects data. */
  publishableKey: string;
}

/** Browser client for client components (e.g. starting the Google OAuth flow). */
export function createBrowserSupabase<Database = unknown>({ url, publishableKey }: SupabaseConfig) {
  return createBrowserClient<Database>(url, publishableKey);
}

/**
 * Returns a same-origin path to redirect to after sign-in, or the fallback. Blocks open
 * redirects such as `//evil.example`, `/\evil.example` or absolute URLs.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next?.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** True when `pathname` equals one of `prefixes` or is nested below it. */
export function matchesPath(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`));
}

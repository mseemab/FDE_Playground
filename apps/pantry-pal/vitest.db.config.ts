import { defineConfig } from "vitest/config";

/**
 * Integration tests against the LOCAL Supabase stack (`pnpm db:start` first). Run with
 * `pnpm test:db`; CI runs them in the `db` job whenever this app is affected.
 */
export default defineConfig({
  test: { include: ["supabase/tests/**/*.test.ts"], testTimeout: 20_000, hookTimeout: 30_000 },
});

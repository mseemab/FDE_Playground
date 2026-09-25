import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** Signed-in end-to-end tests that need the local Supabase stack (`pnpm test:e2e:db`). */
export default defineConfig({ ...base, testDir: "./e2e-db" });

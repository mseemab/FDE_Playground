import { defineConfig, devices } from "@playwright/test";

// Deterministic per-app port so several apps' smoke tests can run in parallel under turbo.
const name = "pantry-pal";
let hash = 0;
for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % 800;
const port = Number(process.env.E2E_PORT ?? 3100 + hash);
const baseURL = `http://127.0.0.1:${String(port)}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: {
    command: `next start --port ${String(port)}`,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

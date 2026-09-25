import { createRequire } from "node:module";
import path from "node:path";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // `server-only` throws outside a React Server Components bundle; unit tests run in Node.
      "server-only": path.join(path.dirname(require.resolve("server-only")), "empty.js"),
    },
  },
  test: { include: ["src/**/*.test.{ts,tsx}"] },
});

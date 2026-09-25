import { createRequire } from "node:module";
import path from "node:path";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);

export default defineConfig({
  // `server-only` throws outside a React Server Components bundle; tests run in plain Node,
  // so point it at the package's own no-op entry (its "react-server" export).
  resolve: {
    alias: { "server-only": path.join(path.dirname(require.resolve("server-only")), "empty.js") },
  },
});

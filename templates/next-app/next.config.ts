import type { NextConfig } from "next";
// Validate environment variables at startup (dev, build and start). See src/env.ts.
import "./src/env";

const nextConfig: NextConfig = {
  transpilePackages: ["@factory/ui", "@factory/analytics"],
};

export default nextConfig;

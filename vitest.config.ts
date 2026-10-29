import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    fileParallelism: false,
    isolate: false,
    maxWorkers: 1,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    env: {
      TZ: "UTC",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

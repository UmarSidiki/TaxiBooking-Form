import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/qa",
  fullyParallel: false,
  workers: 1,
  timeout: 600_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    timezoneId: "UTC",
  },
  webServer: {
    command: "node scripts/qa-server.mjs",
    url: "http://127.0.0.1:3000/en/partners/login",
    timeout: 300_000,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
  ],
});

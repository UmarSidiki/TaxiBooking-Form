import { defineConfig, devices } from "@playwright/test";

const pixel = devices["Pixel 7"];
const iphone = devices["iPhone 13"];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://127.0.0.1:3000/en/partners/login",
    timeout: 300_000,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "pixel",
      use: {
        browserName: "chromium",
        viewport: pixel.viewport,
        userAgent: pixel.userAgent,
        deviceScaleFactor: pixel.deviceScaleFactor,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "iphone",
      use: {
        browserName: "chromium",
        viewport: iphone.viewport,
        userAgent: iphone.userAgent,
        deviceScaleFactor: iphone.deviceScaleFactor,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});

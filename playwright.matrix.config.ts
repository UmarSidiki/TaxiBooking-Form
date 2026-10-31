import { defineConfig } from "@playwright/test";

type MatrixProject = { name: string; use: { browserName: "chromium" | "webkit" } };

const projects: MatrixProject[] = [
  {
    name: "chromium",
    use: { browserName: "chromium" },
  },
];

// WebKit is the Safari engine; opt in because it needs `npx playwright install webkit`.
if (process.env.QA_WEBKIT === "1") {
  projects.push({ name: "webkit", use: { browserName: "webkit" } });
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["qa-matrix.spec.ts", "drawer-matrix.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 300_000,
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
  projects,
});

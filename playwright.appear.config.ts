import base from "./playwright.matrix.config";
const port = process.env.E2E_PORT ?? "3100";
export default {
  ...base,
  testMatch: ["appearance-v2.spec.ts", "palette-v2.spec.ts", "palette-first-paint.spec.ts", "appearance-preview.spec.ts"],
  use: { ...base.use, baseURL: `http://127.0.0.1:${port}` },
  webServer: { ...base.webServer, url: `http://127.0.0.1:${port}/en/partners/login`, reuseExistingServer: true },
};

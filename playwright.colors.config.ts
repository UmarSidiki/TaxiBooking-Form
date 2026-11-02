import base from "./playwright.matrix.config";
const port = process.env.E2E_PORT ?? "3400";
export default {
  ...base,
  testMatch: ["colors-palette.spec.ts", "appearance-v2.spec.ts", "logo-surfaces.spec.ts"],
  use: { ...base.use, baseURL: `http://127.0.0.1:${port}` },
  webServer: { ...base.webServer, url: `http://127.0.0.1:${port}/en/partners/login`, reuseExistingServer: true },
};

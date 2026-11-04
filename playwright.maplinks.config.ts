import base from "./playwright.matrix.config";

const PORT = process.env.E2E_PORT ?? "3300";

export default {
  ...base,
  testMatch: ["ride-map-links.spec.ts"],
  use: { ...base.use, baseURL: `http://127.0.0.1:${PORT}` },
  webServer: { ...base.webServer, command: `E2E_PORT=${PORT} node scripts/e2e-server.mjs`, url: `http://127.0.0.1:${PORT}/en/partners/login` },
};

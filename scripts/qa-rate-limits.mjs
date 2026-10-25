const base = process.env.QA_BASE || "http://127.0.0.1:3000";

async function burst(name, path, init, limitGuess, ip) {
  const headers = { ...(init.headers || {}), "x-forwarded-for": ip };
  const first = await fetch(base + path, { ...init, headers });
  const normal = { status: first.status, retry: first.headers.get("retry-after") };
  let blocked = null;
  let attempts = 1;
  for (let i = 0; i < limitGuess + 5; i += 1) {
    const response = await fetch(base + path, { ...init, headers });
    attempts += 1;
    if (response.status === 429) {
      blocked = { status: 429, retry: response.headers.get("retry-after"), attempts };
      break;
    }
  }
  const other = await fetch(base + path, { ...init, headers: { ...(init.headers || {}), "x-forwarded-for": `${ip}.other` } });
  return { name, path, normal, blocked, otherIp: { status: other.status, retry: other.headers.get("retry-after") } };
}

const json = { method: "POST", headers: { "content-type": "application/json" }, body: "{}" };
const routes = [
  ["booking", "/api/booking", json, 12],
  ["quote", "/api/quote", json, 40],
  ["otp", "/api/account/otp", json, 12],
  ["partner-register", "/api/partners/register", json, 12],
  ["driver-register", "/api/drivers/register", json, 12],
  ["reset", "/api/auth/request-reset", json, 12],
  ["agent", "/api/agent/bookings", { ...json, headers: { ...json.headers, authorization: "Bearer tbk_invalid" } }, 70],
  ["cron-fail", "/api/cron", { method: "GET" }, 30],
];

const evidence = [];
for (const [name, path, init, limit] of routes) {
  evidence.push(await burst(name, path, init, limit, `203.0.113.${evidence.length + 10}`));
}
const adminStatuses = [];
for (let i = 0; i < 15; i += 1) {
  const response = await fetch(base + "/api/admin/pricing", { headers: { "x-forwarded-for": "198.51.100.8" } });
  adminStatuses.push(response.status);
}
const pageStatuses = [];
for (let i = 0; i < 10; i += 1) {
  const response = await fetch(base + "/en/partners/login", { headers: { "x-forwarded-for": "198.51.100.9" } });
  pageStatuses.push(response.status);
}
const cronOk = await fetch(base + "/api/cron", {
  headers: { "x-cron-secret": "qa-cron-secret", "x-forwarded-for": "198.51.100.50" },
});
const report = {
  evidence,
  untouched: {
    adminPricing: adminStatuses,
    publicPage: pageStatuses,
    cronAuthorized: cronOk.status,
  },
};
console.log(JSON.stringify(report, null, 2));

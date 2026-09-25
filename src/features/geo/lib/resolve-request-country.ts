const PLATFORM_COUNTRY_HEADERS = ["x-vercel-ip-country", "cf-ipcountry"];
const PROVIDER_TIMEOUT_MS = 1500;
const RESULT_TTL_MS = 6 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

export type CountrySource = "platform" | "provider" | "none";

export type ResolvedCountry = {
  countryCode: string | null;
  source: CountrySource;
};

const cache = new Map<string, { countryCode: string | null; expiresAt: number }>();

/** Cloudflare reports unknown as XX and Tor as T1. */
function normalizeCountry(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "XX" || code === "T1") return null;
  return code;
}

function isPrivateAddress(ip: string): boolean {
  if (!ip) return true;
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) {
    return true;
  }

  const v4 = lower.startsWith("::ffff:") ? lower.slice(7) : lower;
  const parts = v4.split(".");
  if (parts.length !== 4) return false;

  const first = Number(parts[0]);
  const second = Number(parts[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return false;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate = (
    forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip")
  )?.trim();

  if (!candidate || isPrivateAddress(candidate)) return null;
  return candidate;
}

function readCache(ip: string): { hit: boolean; countryCode: string | null } {
  const entry = cache.get(ip);
  if (!entry) return { hit: false, countryCode: null };
  if (entry.expiresAt <= Date.now()) {
    cache.delete(ip);
    return { hit: false, countryCode: null };
  }
  return { hit: true, countryCode: entry.countryCode };
}

function writeCache(ip: string, countryCode: string | null) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(ip, {
    countryCode,
    expiresAt:
      Date.now() + (countryCode ? RESULT_TTL_MS : FAILURE_TTL_MS),
  });
}

const PROVIDER_CALLS_PER_MINUTE = 40;
let providerWindowStart = 0;
let providerCallsInWindow = 0;

/**
 * Bounds outbound provider calls: without this, distinct spoofed
 * `x-forwarded-for` values would each miss the cache and burn the free quota.
 */
function canCallProvider(): boolean {
  const now = Date.now();
  if (now - providerWindowStart >= 60_000) {
    providerWindowStart = now;
    providerCallsInWindow = 0;
  }
  if (providerCallsInWindow >= PROVIDER_CALLS_PER_MINUTE) return false;
  providerCallsInWindow += 1;
  return true;
}

/**
 * ip-api's free tier is HTTP-only (so it can never be called from the browser)
 * and is not licensed for commercial use, so it is only a development fallback
 * when no platform geo header is present. Set GEO_IP_FALLBACK=off to disable.
 */
async function lookupViaProvider(ip: string): Promise<string | null> {
  if (process.env.GEO_IP_FALLBACK === "off") return null;
  if (!canCallProvider()) return null;

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS), cache: "no-store" }
    );
    if (!response.ok) return null;

    const data = await response.json();
    return data?.status === "success" ? normalizeCountry(data.countryCode) : null;
  } catch {
    return null;
  }
}

/**
 * Resolves the visitor's country. Prefers the hosting platform's geo header
 * (Vercel/Cloudflare set it at the edge and strip client-supplied values);
 * falls back to ip-api only when no header is present.
 *
 * Returns `countryCode: null` when unknown - callers treat that as "allow".
 */
export async function resolveRequestCountry(
  request: Request
): Promise<ResolvedCountry> {
  for (const header of PLATFORM_COUNTRY_HEADERS) {
    const code = normalizeCountry(request.headers.get(header));
    if (code) return { countryCode: code, source: "platform" };
  }

  const ip = clientIp(request);
  if (!ip) return { countryCode: null, source: "none" };

  const cached = readCache(ip);
  if (cached.hit) return { countryCode: cached.countryCode, source: "provider" };

  const countryCode = await lookupViaProvider(ip);
  writeCache(ip, countryCode);
  return { countryCode, source: "provider" };
}

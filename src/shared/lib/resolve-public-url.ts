export type HeadersLike = {
  get(name: string): string | null;
};

/** Accepts `next/headers`' ReadonlyHeaders or anything with `.headers`. */
export type RequestHeadersLike = HeadersLike | { headers: HeadersLike };

export type ResolvePublicUrlInput = {
  request?: RequestHeadersLike | null;
  persistedBaseUrl?: string | null;
};

const HTTP_RE = /^https?:\/\//i;

export function normalizeBaseUrl(raw?: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  const withProtocol = HTTP_RE.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function hostOf(base: string) {
  try {
    return new URL(base).host.toLowerCase();
  } catch {
    return "";
  }
}

function isLocalhostBase(base: string) {
  try {
    const host = new URL(base).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".localhost")
    );
  } catch {
    return false;
  }
}

function headersOf(
  request?: RequestHeadersLike | null
): HeadersLike | null {
  if (!request) return null;
  if (typeof (request as HeadersLike).get === "function") return request as HeadersLike;
  const nested = (request as { headers?: HeadersLike }).headers;
  return nested && typeof nested.get === "function" ? nested : null;
}

function header(
  request: RequestHeadersLike | null | undefined,
  name: string
) {
  return headersOf(request)?.get(name)?.split(",")[0]?.trim() || null;
}

function protocolFor(host: string, forwardedProto: string | null) {
  const proto = forwardedProto?.toLowerCase();
  if (proto === "http" || proto === "https") return proto;
  return isLocalhostBase(`https://${host}`) ? "http" : "https";
}

function forwardedBase(request?: RequestHeadersLike | null) {
  const host = header(request, "x-forwarded-host");
  if (!host) return null;
  const proto = protocolFor(host, header(request, "x-forwarded-proto"));
  return normalizeBaseUrl(`${proto}://${host}`);
}

function hostBase(request?: RequestHeadersLike | null) {
  const host = header(request, "host");
  if (!host) return null;
  const proto = protocolFor(host, header(request, "x-forwarded-proto"));
  return normalizeBaseUrl(`${proto}://${host}`);
}

function envOverride() {
  return (
    normalizeBaseUrl(process.env.APP_URL_OVERRIDE) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL)
  );
}

function vercelBase() {
  return (
    normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeBaseUrl(process.env.VERCEL_URL)
  );
}

function isAllowed(
  candidate: string,
  override: string | null,
  persisted: string | null
) {
  const host = hostOf(candidate);
  if (!host) return false;

  // Never synthesize a localhost URL for production emails.
  if (isProduction() && isLocalhostBase(candidate)) return false;

  // First admin request: nothing persisted yet, so the detected host wins.
  if (!persisted) return true;

  if (host === hostOf(persisted)) return true;
  if (override && host === hostOf(override)) return true;

  const vercel = vercelBase();
  if (vercel && host === hostOf(vercel)) return true;

  return !isProduction() && isLocalhostBase(candidate);
}

/**
 * The host this request actually came from, without the allow-list. Used to
 * show/persist "Public URL (detected)" for an authenticated dashboard request.
 */
export function detectRequestBaseUrl(
  request?: RequestHeadersLike | null
): string | null {
  return forwardedBase(request) ?? hostBase(request);
}

/**
 * Single resolution order for the public site URL:
 * explicit override -> x-forwarded-host -> host -> persisted setting ->
 * Vercel production URL -> Vercel deployment URL -> null.
 */
export function resolvePublicUrl(
  input: ResolvePublicUrlInput = {}
): string | null {
  const override = envOverride();
  if (override) return override;

  const persisted = normalizeBaseUrl(input.persistedBaseUrl);

  if (input.request) {
    const forwarded = forwardedBase(input.request);
    if (forwarded && isAllowed(forwarded, override, persisted)) return forwarded;

    const host = hostBase(input.request);
    if (host && isAllowed(host, override, persisted)) return host;
  }

  if (persisted && !(isProduction() && isLocalhostBase(persisted))) {
    return persisted;
  }

  return vercelBase();
}

export function shouldPersistPublicBaseUrl(
  detected?: string | null,
  persistedBaseUrl?: string | null
): boolean {
  const detectedBase = normalizeBaseUrl(detected);
  if (!detectedBase) return false;
  if (isProduction() && isLocalhostBase(detectedBase)) return false;

  const host = hostOf(detectedBase);
  if (!host || host === "vercel.app" || host.endsWith(".vercel.app")) {
    return false;
  }

  const persisted = normalizeBaseUrl(persistedBaseUrl);
  return !persisted || hostOf(persisted) !== host;
}

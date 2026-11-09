import { getThemeSettings } from "@/features/settings/lib/theme-settings";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";

export const dynamic = "force-dynamic";

const DATA_URL = /^data:(image\/[a-z+.-]+)(;base64)?,([\s\S]*)$/i;
const FETCH_TIMEOUT_MS = 5_000;

function toBody(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

/** The operator's logo, served as the site icon: one source, no placeholder. */
function imageResponse(bytes: Uint8Array, contentType: string) {
  return new Response(toBody(bytes), {
    headers: {
      "Content-Type": contentType,
      // Let a saved logo reach every browser, but re-check instead of pinning
      // yesterday's icon in the cache.
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

function fromDataUrl(value: string): { bytes: Uint8Array; contentType: string } | null {
  const match = DATA_URL.exec(value);
  if (!match) return null;
  const [, type, base64, payload] = match;
  try {
    const bytes = base64
      ? Buffer.from(payload ?? "", "base64")
      : Buffer.from(decodeURIComponent(payload ?? ""), "utf8");
    return { bytes, contentType: (type ?? "").toLowerCase() };
  } catch {
    return null;
  }
}

async function fromUrl(value: string, request: Request) {
  const base = await resolvePublicUrl({ request });
  const absolute = value.startsWith("/")
    ? base
      ? new URL(value, base).toString()
      : null
    : value;
  if (!absolute) return null;

  try {
    const upstream = await fetch(absolute, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    const contentType = (upstream.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
    if (!upstream.ok || !contentType.startsWith("image/")) return null;
    return { bytes: new Uint8Array(await upstream.arrayBuffer()), contentType };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const theme = await getThemeSettings();
  const logo = theme.companyLogoUrl?.trim() ?? "";

  const resolved = logo
    ? fromDataUrl(logo) ?? (await fromUrl(logo, request))
    : null;

  if (!resolved) {
    // Nothing saved yet: keep the packaged icon rather than inventing a brand.
    return new Response(null, { status: 307, headers: { Location: "/icon.png" } });
  }

  return imageResponse(resolved.bytes, resolved.contentType);
}

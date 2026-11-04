import { readFile } from "node:fs/promises";
import path from "node:path";

const IMAGE_DATA_URL = /^data:image\/(?:png|jpeg|webp|gif|svg\+xml);base64,/;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

async function readLocalLogo(url: string): Promise<string | null> {
  const publicRoot = path.resolve(process.cwd(), "public");
  const filePath = path.resolve(publicRoot, `.${url}`);
  if (!filePath.startsWith(`${publicRoot}${path.sep}`)) return null;
  const bytes = await readFile(filePath);
  if (bytes.length > MAX_LOGO_BYTES) return null;
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const type = ext === "svg" ? "svg+xml" : ext === "jpg" ? "jpeg" : ext || "png";
  return `data:image/${type};base64,${bytes.toString("base64")}`;
}

async function readCappedBody(res: Response): Promise<Buffer | null> {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_LOGO_BYTES) return null;
  if (!res.body) {
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > MAX_LOGO_BYTES ? null : buf;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_LOGO_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

async function fetchRemoteLogo(url: string): Promise<string | null> {
  if (!url.startsWith("https://")) return null;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    redirect: "error",
  });
  if (!res.ok) return null;
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (!contentType.startsWith("image/")) return null;
  const body = await readCappedBody(res);
  if (!body) return null;
  return `data:${contentType.split(";")[0].trim()};base64,${body.toString("base64")}`;
}

async function fallbackLogo(): Promise<string | undefined> {
  try {
    const bytes = await readFile(path.join(process.cwd(), "public/icon.png"));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function logoDataUrl(
  settings: { companyLogoUrl?: string } | null,
): Promise<string | undefined> {
  const url = settings?.companyLogoUrl?.trim();
  if (url) {
    try {
      if (IMAGE_DATA_URL.test(url)) return url;
      if (url.startsWith("/") && !url.startsWith("//")) {
        return (await readLocalLogo(url)) ?? (await fallbackLogo());
      }
      return (await fetchRemoteLogo(url)) ?? (await fallbackLogo());
    } catch {
      // fall through
    }
  }
  return fallbackLogo();
}

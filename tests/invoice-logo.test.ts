import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logoDataUrl } from "@/features/invoices/lib/invoice-logo";

const MAX_BYTES = 2 * 1024 * 1024;

async function fallbackDataUrl() {
  const bytes = await readFile(path.join(process.cwd(), "public/icon.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

describe("invoice logo resolution", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches an https image and inlines it", async () => {
    const body = Buffer.from("logo-bytes");
    fetchMock.mockResolvedValue(
      new Response(body, { status: 200, headers: { "content-type": "image/png" } }),
    );

    const result = await logoDataUrl({ companyLogoUrl: "https://cdn.example.com/logo.png" });

    expect(result).toBe(`data:image/png;base64,${body.toString("base64")}`);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cdn.example.com/logo.png",
      expect.objectContaining({ redirect: "error", signal: expect.anything() }),
    );
  });

  it("rejects a non-image content type and falls back", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } }),
    );

    const result = await logoDataUrl({ companyLogoUrl: "https://cdn.example.com/logo" });

    expect(result).toBe(await fallbackDataUrl());
  });

  it("never fetches plain http urls", async () => {
    const result = await logoDataUrl({ companyLogoUrl: "http://cdn.example.com/logo.png" });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(await fallbackDataUrl());
  });

  it("rejects a body over 2 MB", async () => {
    fetchMock.mockResolvedValue(
      new Response(Buffer.alloc(MAX_BYTES + 1), {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );

    const result = await logoDataUrl({ companyLogoUrl: "https://cdn.example.com/huge.png" });

    expect(result).toBe(await fallbackDataUrl());
  });

  it("rejects an oversized declared content-length", async () => {
    fetchMock.mockResolvedValue(
      new Response("small", {
        status: 200,
        headers: { "content-type": "image/png", "content-length": String(MAX_BYTES + 1) },
      }),
    );

    const result = await logoDataUrl({ companyLogoUrl: "https://cdn.example.com/huge.png" });

    expect(result).toBe(await fallbackDataUrl());
  });

  it("passes a supported data URL through untouched", async () => {
    const dataUrl = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";

    const result = await logoDataUrl({ companyLogoUrl: dataUrl });

    expect(result).toBe(dataUrl);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects path traversal outside public/", async () => {
    const envBytes = Buffer.from("SECRET=must-not-leak");

    const result = await logoDataUrl({ companyLogoUrl: "/../.env" });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(await fallbackDataUrl());
    if (result) {
      expect(Buffer.from(result.split(",")[1] ?? "", "base64").equals(envBytes)).toBe(false);
    }
  });
});

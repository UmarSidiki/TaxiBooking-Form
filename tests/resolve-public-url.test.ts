import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  detectRequestBaseUrl,
  resolvePublicUrl,
  shouldPersistPublicBaseUrl,
} from "@/shared/lib/resolve-public-url";

const ENV_KEYS = [
  "APP_URL_OVERRIDE",
  "NEXT_PUBLIC_BASE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "NODE_ENV",
] as const;

let saved: Record<string, string | undefined>;

function request(headers: Record<string, string>) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  };
}

beforeEach(() => {
  saved = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    if (key !== "NODE_ENV") delete process.env[key];
  }
  vi.stubEnv("NODE_ENV", "test");
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const key of ENV_KEYS) {
    const env = process.env as Record<string, string | undefined>;
    if (saved[key] === undefined) delete env[key];
    else env[key] = saved[key];
  }
});

describe("resolvePublicUrl", () => {
  it("prefers the explicit override over requests and persisted settings", () => {
    process.env.APP_URL_OVERRIDE = "https://override.example.com/some/path";
    process.env.NEXT_PUBLIC_BASE_URL = "https://public.example.com";

    expect(
      resolvePublicUrl({
        request: request({ host: "app.example.com" }),
        persistedBaseUrl: "https://saved.example.com",
      }),
    ).toBe("https://override.example.com");
  });

  it("uses NEXT_PUBLIC_BASE_URL and adds https when no protocol is given", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "taxi.example.com";

    expect(resolvePublicUrl()).toBe("https://taxi.example.com");
  });

  it("uses x-forwarded-host before the host header", () => {
    expect(
      resolvePublicUrl({
        request: request({
          "x-forwarded-host": "public.example.com",
          host: "internal:8080",
        }),
      }),
    ).toBe("https://public.example.com");
  });

  it("defaults the plain host header to https", () => {
    expect(
      resolvePublicUrl({ request: request({ host: "taxi.example.com" }) }),
    ).toBe("https://taxi.example.com");
  });

  it("uses http for localhost in development", () => {
    expect(
      resolvePublicUrl({ request: request({ host: "localhost:3000" }) }),
    ).toBe("http://localhost:3000");
  });

  it("honours x-forwarded-proto", () => {
    expect(
      resolvePublicUrl({
        request: request({
          "x-forwarded-host": "taxi.example.com",
          "x-forwarded-proto": "http",
        }),
      }),
    ).toBe("http://taxi.example.com");
  });

  it("rejects a spoofed host and falls back to the persisted domain", () => {
    expect(
      resolvePublicUrl({
        request: request({
          "x-forwarded-host": "evil.example.com",
          host: "evil.example.com",
        }),
        persistedBaseUrl: "https://taxi.example.com",
      }),
    ).toBe("https://taxi.example.com");
  });

  it("accepts a request host that matches the persisted domain", () => {
    expect(
      resolvePublicUrl({
        request: request({ host: "taxi.example.com" }),
        persistedBaseUrl: "https://taxi.example.com",
      }),
    ).toBe("https://taxi.example.com");
  });

  it("accepts the detected host when nothing is persisted yet", () => {
    expect(
      resolvePublicUrl({
        request: request({ host: "new.example.com" }),
        persistedBaseUrl: null,
      }),
    ).toBe("https://new.example.com");
  });

  it("falls back to the persisted setting without a request", () => {
    expect(
      resolvePublicUrl({ persistedBaseUrl: "https://taxi.example.com" }),
    ).toBe("https://taxi.example.com");
  });

  it("falls back to Vercel project and deployment URLs", () => {
    process.env.VERCEL_URL = "preview-123.vercel.app";
    expect(resolvePublicUrl()).toBe("https://preview-123.vercel.app");

    process.env.VERCEL_PROJECT_PRODUCTION_URL = "taxi.vercel.app";
    expect(resolvePublicUrl()).toBe("https://taxi.vercel.app");
  });

  it("never returns a localhost URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(
      resolvePublicUrl({ request: request({ host: "localhost:3000" }) }),
    ).toBeNull();
    expect(
      resolvePublicUrl({ persistedBaseUrl: "http://localhost:3000" }),
    ).toBeNull();
  });

  it("returns null when nothing can be resolved", () => {
    expect(resolvePublicUrl()).toBeNull();
  });
});

describe("detectRequestBaseUrl", () => {
  it("prefers the forwarded host and proto", () => {
    expect(
      detectRequestBaseUrl(
        request({
          "x-forwarded-host": "public.example.com",
          "x-forwarded-proto": "https",
          host: "internal:3000",
        }),
      ),
    ).toBe("https://public.example.com");
  });

  it("falls back to the host header", () => {
    expect(detectRequestBaseUrl(request({ host: "taxi.example.com" }))).toBe(
      "https://taxi.example.com",
    );
  });
});

describe("shouldPersistPublicBaseUrl", () => {
  it("skips Vercel preview hosts", () => {
    expect(
      shouldPersistPublicBaseUrl(
        "https://taxi.vercel.app",
        "https://taxi.example.com",
      ),
    ).toBe(false);
  });

  it("persists a new or changed host", () => {
    expect(
      shouldPersistPublicBaseUrl(
        "https://new.example.com",
        "https://old.example.com",
      ),
    ).toBe(true);
    expect(shouldPersistPublicBaseUrl("https://new.example.com", null)).toBe(
      true,
    );
  });

  it("skips an unchanged host", () => {
    expect(
      shouldPersistPublicBaseUrl(
        "https://taxi.example.com",
        "https://taxi.example.com",
      ),
    ).toBe(false);
  });

  it("does not persist localhost in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(shouldPersistPublicBaseUrl("http://localhost:3000", null)).toBe(
      false,
    );
  });
});

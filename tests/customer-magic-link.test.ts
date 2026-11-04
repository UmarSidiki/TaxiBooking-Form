import { describe, expect, it } from "vitest";
import {
  consumeMagicLink,
  createMagicLink,
  magicLinkTtlMs,
} from "@/features/customers/lib/magic-link";
import {
  customerSessionCookie,
} from "@/features/customers/lib/customer-session";
import CustomerLoginToken from "@/features/customers/model/CustomerLoginToken";
import CustomerSession from "@/features/customers/model/CustomerSession";

function tokenOf(url: string) {
  const parsed = new URL(url);
  return new URLSearchParams(parsed.hash.replace(/^#/, "")).get("t") ?? "";
}

function legacyApiUrl(token: string, locale = "en") {
  return `http://local/api/account/link?t=${encodeURIComponent(token)}&l=${locale}`;
}

function postRequest(
  token: string,
  options: { origin?: string; contentType?: string } = {},
) {
  return new Request("http://local/api/account/link", {
    method: "POST",
    headers: {
      "content-type": options.contentType ?? "application/json",
      ...(options.origin
        ? { origin: options.origin, "sec-fetch-site": "cross-site" }
        : {}),
    },
    body: JSON.stringify({ token }),
  });
}

describe("customer magic links", () => {
  it("builds a page link with the token in the fragment", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "en",
    });
    expect(url).toBeTruthy();
    const parsed = new URL(url!);
    const token = tokenOf(url!);
    expect(parsed.pathname).toBe("/en/account/link");
    expect(parsed.search).toBe("");
    expect(parsed.hash).toBe(`#t=${token}`);
    expect(token).not.toBe("");
  });

  it("expires login links after 15 minutes", async () => {
    const before = Date.now();
    await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "en",
    });
    const after = Date.now();

    const row = await CustomerLoginToken.findOne({ emailLower: "ada@example.com" });
    const expiresAt = row!.expiresAt.getTime();
    expect(row?.purpose).toBe("login");
    expect(magicLinkTtlMs("login")).toBe(15 * 60 * 1000);
    expect(expiresAt).toBeGreaterThanOrEqual(before + magicLinkTtlMs("login"));
    expect(expiresAt).toBeLessThanOrEqual(after + magicLinkTtlMs("login"));
  });

  it("expires email links after 24 hours and still signs in", async () => {
    const before = Date.now();
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "en",
      purpose: "email",
    });
    const after = Date.now();

    const row = await CustomerLoginToken.findOne({ emailLower: "ada@example.com" });
    const expiresAt = row!.expiresAt.getTime();
    expect(row?.purpose).toBe("email");
    expect(magicLinkTtlMs("email")).toBe(24 * 60 * 60 * 1000);
    expect(expiresAt).toBeGreaterThanOrEqual(before + magicLinkTtlMs("email"));
    expect(expiresAt).toBeLessThanOrEqual(after + magicLinkTtlMs("email"));
    expect(await consumeMagicLink(tokenOf(url!))).toEqual({ emailLower: "ada@example.com" });
  });

  it("stores only a hash and marks the token used", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "en",
    });
    expect(url).toBeTruthy();
    const token = tokenOf(url!);
    const row = await CustomerLoginToken.findOne({ emailLower: "ada@example.com" });
    expect(row?.tokenHash).toBeTruthy();
    expect(row?.tokenHash).not.toBe(token);
    expect(row?.usedAt).toBeNull();

    expect(await consumeMagicLink(token)).toEqual({ emailLower: "ada@example.com" });
    expect(await consumeMagicLink(token)).toBeNull();
    const used = await CustomerLoginToken.findById(row?._id);
    expect(used?.usedAt).toBeInstanceOf(Date);
  });

  it("redirects GET to the page fragment without consuming the token", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "fr",
    });
    const token = tokenOf(url!);
    const { GET } = await import("@/app/api/account/link/route");
    const response = await GET(new Request(legacyApiUrl(token, "fr")));

    expect(response.status).toBe(303);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/fr/account/link");
    expect(location.search).toBe("");
    expect(location.hash).toBe(`#t=${encodeURIComponent(token)}`);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toBeNull();

    const row = await CustomerLoginToken.findOne({ emailLower: "ada@example.com" });
    expect(row?.usedAt).toBeNull();
    expect(await CustomerSession.countDocuments()).toBe(0);
    expect(await consumeMagicLink(token)).toEqual({ emailLower: "ada@example.com" });
  });

  it("signs in once with POST", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "fr",
    });
    const token = tokenOf(url!);
    const { POST } = await import("@/app/api/account/link/route");

    const response = await POST(postRequest(token));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toContain(customerSessionCookie().name);
    expect(await CustomerSession.countDocuments({ emailLower: "ada@example.com" })).toBe(1);

    const reused = await POST(postRequest(token));
    expect(reused.status).toBe(400);
    expect(await reused.json()).toEqual({ code: "expired" });
    expect(reused.headers.get("set-cookie")).toBeNull();
    expect(await CustomerSession.countDocuments({ emailLower: "ada@example.com" })).toBe(1);
  });

  it("rejects an expired link", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "en",
    });
    await CustomerLoginToken.updateOne(
      { emailLower: "ada@example.com" },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );
    const { POST } = await import("@/app/api/account/link/route");
    const response = await POST(postRequest(tokenOf(url!)));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ code: "expired" });
    expect(await CustomerSession.countDocuments()).toBe(0);
  });

  it("rejects a cross-origin POST without consuming the token", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "en",
    });
    const token = tokenOf(url!);
    const { POST } = await import("@/app/api/account/link/route");
    const response = await POST(
      postRequest(token, { origin: "https://evil.example" }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await CustomerSession.countDocuments()).toBe(0);

    const row = await CustomerLoginToken.findOne({ emailLower: "ada@example.com" });
    expect(row?.usedAt).toBeNull();
    expect(await consumeMagicLink(token)).toEqual({ emailLower: "ada@example.com" });
  });

  it("requires a JSON content type", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "en",
    });
    const token = tokenOf(url!);
    const { POST } = await import("@/app/api/account/link/route");
    const response = await POST(postRequest(token, { contentType: "text/plain" }));

    expect(response.status).toBe(415);
    expect(await CustomerSession.countDocuments()).toBe(0);
    expect(await consumeMagicLink(token)).toEqual({ emailLower: "ada@example.com" });
  });

  it("creates exactly one session when the same link is used twice at once", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "en",
    });
    const token = tokenOf(url!);
    const { POST } = await import("@/app/api/account/link/route");
    const responses = await Promise.all([
      POST(postRequest(token)),
      POST(postRequest(token)),
    ]);

    const withCookie = responses.filter((response) => response.headers.get("set-cookie"));
    expect(withCookie).toHaveLength(1);
    expect(withCookie[0].status).toBe(200);
    expect(await CustomerSession.countDocuments({ emailLower: "ada@example.com" })).toBe(1);
  });
});

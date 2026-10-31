import { describe, expect, it } from "vitest";
import {
  consumeMagicLink,
  createMagicLink,
} from "@/features/customers/lib/magic-link";
import {
  customerSessionCookie,
} from "@/features/customers/lib/customer-session";
import CustomerLoginToken from "@/features/customers/model/CustomerLoginToken";
import CustomerSession from "@/features/customers/model/CustomerSession";

function tokenOf(url: string) {
  return new URL(url).searchParams.get("t") ?? "";
}

function linkRequest(url: string) {
  const token = tokenOf(url);
  return new Request(`http://local/api/account/link?t=${encodeURIComponent(token)}&l=${new URL(url).searchParams.get("l")}`);
}

describe("customer magic links", () => {
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

  it("signs in once and redirects to a clean account URL", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "fr",
    });
    const { GET } = await import("@/app/api/account/link/route");
    const response = await GET(linkRequest(url!));

    expect(response.status).toBe(303);
    const location = response.headers.get("location") ?? "";
    expect(new URL(location).pathname).toBe("/fr/account");
    expect(location).not.toContain("t=");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toContain(customerSessionCookie().name);
    expect(await CustomerSession.countDocuments({ emailLower: "ada@example.com" })).toBe(1);
  });

  it("rejects a reused link without creating another session", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "en",
    });
    const { GET } = await import("@/app/api/account/link/route");
    await GET(linkRequest(url!));
    const response = await GET(linkRequest(url!));

    expect(response.status).toBe(303);
    const location = response.headers.get("location") ?? "";
    expect(new URL(location).searchParams.get("link")).toBe("expired");
    expect(location).not.toContain("t=");
    expect(response.headers.get("set-cookie")).toBeNull();
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
    const { GET } = await import("@/app/api/account/link/route");
    const response = await GET(linkRequest(url!));

    expect(response.status).toBe(303);
    expect(new URL(response.headers.get("location") ?? "").searchParams.get("link")).toBe(
      "expired",
    );
    expect(await CustomerSession.countDocuments({ emailLower: "ada@example.com" })).toBe(0);
  });

  it("creates exactly one session when the same link is used twice at once", async () => {
    const url = await createMagicLink("ada@example.com", {
      baseUrl: "http://local",
      locale: "en",
    });
    const { GET } = await import("@/app/api/account/link/route");
    const responses = await Promise.all([GET(linkRequest(url!)), GET(linkRequest(url!))]);

    const withCookie = responses.filter((response) => response.headers.get("set-cookie"));
    expect(withCookie).toHaveLength(1);
    expect(await CustomerSession.countDocuments({ emailLower: "ada@example.com" })).toBe(1);
  });
});

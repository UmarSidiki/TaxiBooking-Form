import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCustomerSession,
  customerSessionCookie,
  revokeCustomerSession,
} from "@/features/customers/lib/customer-session";
import CustomerSession from "@/features/customers/model/CustomerSession";
import { signLegacyToken } from "./helpers/legacy-token";

const mocks = vi.hoisted(() => ({ cookie: null as string | null, cookieName: "cs" }));

vi.mock("next/headers", () => ({
  cookies: async () =>
    new Map(
      mocks.cookie ? [[mocks.cookieName, { name: mocks.cookieName, value: mocks.cookie }]] : [],
    ),
}));

afterAll(() => {
  vi.doUnmock("next/headers");
  vi.resetModules();
});

function tripsRequest() {
  return new Request("http://local/api/account/trips");
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret";
  mocks.cookieName = customerSessionCookie().name;
  mocks.cookie = null;
});

describe("customer sessions", () => {
  it("returns the email for a valid session", async () => {
    mocks.cookie = await createCustomerSession("ada@example.com");
    const { GET } = await import("@/app/api/account/trips/route");
    const response = await GET(tripsRequest());
    expect(response.status).toBe(200);
    expect((await response.json()).email).toBe("ada@example.com");
  });

  it("rejects a revoked session immediately", async () => {
    const id = await createCustomerSession("ada@example.com");
    mocks.cookie = id;
    await revokeCustomerSession();
    const { GET } = await import("@/app/api/account/trips/route");
    expect((await GET(tripsRequest())).status).toBe(401);
  });

  it("rejects an expired session", async () => {
    mocks.cookie = await createCustomerSession("ada@example.com");
    await CustomerSession.updateOne({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const { GET } = await import("@/app/api/account/trips/route");
    expect((await GET(tripsRequest())).status).toBe(401);
  });

  it("rejects a session past the absolute deadline", async () => {
    mocks.cookie = await createCustomerSession("ada@example.com");
    await CustomerSession.updateOne({}, { $set: { createdAt: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000) } });
    const { GET } = await import("@/app/api/account/trips/route");
    expect((await GET(tripsRequest())).status).toBe(401);
  });

  it("slides an idle session and extends the cookie", async () => {
    const id = await createCustomerSession("ada@example.com");
    const stale = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await CustomerSession.updateOne(
      {},
      {
        $set: {
          lastSeenAt: stale,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      },
    );
    const { GET } = await import("@/app/api/account/me/route");
    const response = await GET(
      new Request("http://local/api/account/me", {
        headers: { cookie: `${mocks.cookieName}=${id}` },
      }),
    );
    expect(response.status).toBe(200);

    const row = await CustomerSession.findOne({});
    expect(row?.lastSeenAt.getTime()).toBeGreaterThan(stale.getTime());
    expect(row?.expiresAt.getTime()).toBeGreaterThan(
      Date.now() + 29 * 24 * 60 * 60 * 1000,
    );

    const maxAge = /Max-Age=(\d+)/i.exec(response.headers.get("set-cookie") ?? "");
    expect(Number(maxAge?.[1])).toBeGreaterThan(29 * 24 * 60 * 60);
  });

  it("caps the sliding expiry at 90 days after creation", async () => {
    const id = await createCustomerSession("ada@example.com");
    const createdAt = new Date(Date.now() - 89 * 24 * 60 * 60 * 1000);
    await CustomerSession.updateOne(
      {},
      {
        $set: {
          createdAt,
          lastSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      },
    );
    const { GET } = await import("@/app/api/account/me/route");
    const response = await GET(
      new Request("http://local/api/account/me", {
        headers: { cookie: `${mocks.cookieName}=${id}` },
      }),
    );
    expect(response.status).toBe(200);

    const row = await CustomerSession.findOne({});
    expect(row?.expiresAt.getTime()).toBe(
      createdAt.getTime() + 90 * 24 * 60 * 60 * 1000,
    );
  });

  it("does not touch a session seen within the last hour", async () => {
    const id = await createCustomerSession("ada@example.com");
    const seen = new Date(Date.now() - 5 * 60 * 1000);
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    await CustomerSession.updateOne({}, { $set: { lastSeenAt: seen, expiresAt } });
    const { GET } = await import("@/app/api/account/me/route");
    const response = await GET(
      new Request("http://local/api/account/me", {
        headers: { cookie: `${mocks.cookieName}=${id}` },
      }),
    );
    expect(response.status).toBe(200);

    const row = await CustomerSession.findOne({});
    expect(row?.lastSeenAt.getTime()).toBe(seen.getTime());
    expect(row?.expiresAt.getTime()).toBe(expiresAt.getTime());
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("revokes on logout and clears the cookie", async () => {
    const id = await createCustomerSession("ada@example.com");
    mocks.cookie = id;
    const { POST } = await import("@/app/api/account/logout/route");
    const response = await POST(new Request("http://local/api/account/logout", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(mocks.cookieName);

    const { GET } = await import("@/app/api/account/trips/route");
    expect((await GET(tripsRequest())).status).toBe(401);
  });

  it("refuses a cross-site logout", async () => {
    mocks.cookie = await createCustomerSession("ada@example.com");
    const { POST } = await import("@/app/api/account/logout/route");
    const response = await POST(
      new Request("http://local/api/account/logout", {
        method: "POST",
        headers: { origin: "https://evil.example" },
      }),
    );
    expect(response.status).toBe(403);

    const { GET } = await import("@/app/api/account/trips/route");
    expect((await GET(tripsRequest())).status).toBe(200);
  });

  it("revoke-all kills two sessions of the same email", async () => {
    const first = await createCustomerSession("ada@example.com");
    const second = await createCustomerSession("ada@example.com");
    const { POST } = await import("@/app/api/account/sessions/revoke-all/route");
    const response = await POST(
      new Request("http://local/api/account/sessions/revoke-all", {
        method: "POST",
        headers: { cookie: `${mocks.cookieName}=${first}` },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(mocks.cookieName);

    const { GET } = await import("@/app/api/account/trips/route");
    mocks.cookie = first;
    expect((await GET(tripsRequest())).status).toBe(401);
    mocks.cookie = second;
    expect((await GET(tripsRequest())).status).toBe(401);
  });

  it("rejects the legacy HMAC cookie", async () => {
    mocks.cookieName = "customer_session";
    mocks.cookie = signLegacyToken("ada@example.com");
    const { GET } = await import("@/app/api/account/trips/route");
    expect((await GET(tripsRequest())).status).toBe(401);
  });
});

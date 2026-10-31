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

  it("revokes on logout and clears the cookie", async () => {
    const id = await createCustomerSession("ada@example.com");
    mocks.cookie = id;
    const { POST } = await import("@/app/api/account/logout/route");
    const response = await POST();
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(mocks.cookieName);

    const { GET } = await import("@/app/api/account/trips/route");
    expect((await GET(tripsRequest())).status).toBe(401);
  });

  it("rejects the legacy HMAC cookie", async () => {
    mocks.cookieName = "customer_session";
    mocks.cookie = signLegacyToken("ada@example.com");
    const { GET } = await import("@/app/api/account/trips/route");
    expect((await GET(tripsRequest())).status).toBe(401);
  });
});

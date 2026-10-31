import { describe, expect, it } from "vitest";
import { signLegacyToken } from "./helpers/legacy-token";

type Case = {
  name: string;
  url: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  run: (request: Request) => Promise<Response>;
};

const cases: Case[] = [
  {
    name: "trips",
    url: "/api/account/trips",
    method: "GET",
    run: async (request) => (await import("@/app/api/account/trips/route")).GET(request),
  },
  {
    name: "profile GET",
    url: "/api/account/profile",
    method: "GET",
    run: async (request) => (await import("@/app/api/account/profile/route")).GET(request),
  },
  {
    name: "profile PATCH",
    url: "/api/account/profile",
    method: "PATCH",
    run: async (request) => (await import("@/app/api/account/profile/route")).PATCH(request),
  },
  {
    name: "phone POST",
    url: "/api/account/phone",
    method: "POST",
    run: async (request) => (await import("@/app/api/account/phone/route")).POST(request),
  },
  {
    name: "phone DELETE",
    url: "/api/account/phone",
    method: "DELETE",
    run: async (request) => (await import("@/app/api/account/phone/route")).DELETE(request),
  },
  {
    name: "trip POST",
    url: "/api/account/trips/trip-1",
    method: "POST",
    run: async (request) =>
      (await import("@/app/api/account/trips/[id]/route")).POST(request, {
        params: Promise.resolve({ id: "trip-1" }),
      }),
  },
  {
    name: "quote-cancel",
    url: "/api/account/trips/trip-1/quote-cancel",
    method: "GET",
    run: async (request) =>
      (await import("@/app/api/account/trips/[id]/quote-cancel/route")).GET(request, {
        params: Promise.resolve({ id: "trip-1" }),
      }),
  },
];

function request(testCase: Case, headers: Record<string, string> = {}) {
  const body =
    testCase.method === "POST" || testCase.method === "PATCH"
      ? JSON.stringify({ action: "cancel" })
      : undefined;
  return new Request(`http://local${testCase.url}`, {
    method: testCase.method,
    headers,
    body,
  });
}

describe("legacy account links are rejected", () => {
  for (const testCase of cases) {
    it(`rejects ?token on ${testCase.name}`, async () => {
      process.env.NEXTAUTH_SECRET = "test-secret";
      const token = signLegacyToken("ada@example.com");
      const withToken: Case = {
        ...testCase,
        url: `${testCase.url}?token=${encodeURIComponent(token)}`,
      };
      expect((await testCase.run(request(withToken))).status).toBe(401);
    });

    it(`rejects the legacy cookie on ${testCase.name}`, async () => {
      process.env.NEXTAUTH_SECRET = "test-secret";
      const token = signLegacyToken("ada@example.com");
      const response = await testCase.run(
        request(testCase, { cookie: `customer_session=${token}` }),
      );
      expect(response.status).toBe(401);
    });
  }
});

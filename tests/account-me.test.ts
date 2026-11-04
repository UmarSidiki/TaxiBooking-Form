import { describe, expect, it } from "vitest";
import {
  createCustomerSession,
  customerSessionCookie,
} from "@/features/customers/lib/customer-session";
import CustomerProfile from "@/features/customers/model/CustomerProfile";

function meRequest(cookie?: string) {
  return new Request("http://local/api/account/me", {
    headers: cookie ? { cookie: `${customerSessionCookie().name}=${cookie}` } : undefined,
  });
}

describe("GET /api/account/me", () => {
  it("returns 401 with no PII when signed out", async () => {
    const { GET } = await import("@/app/api/account/me/route");
    const response = await GET(meRequest());

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body).toEqual({ error: "unauthorized" });
    expect(JSON.stringify(body)).not.toContain("@");
  });

  it("returns only the owner's profile fields for a valid session", async () => {
    await CustomerProfile.create({
      email: "ada@example.com",
      name: "Ada",
      verifiedPhone: "+41791234567",
      language: "fr",
      whatsappOptIn: true,
      savedAddresses: { home: "Rue 1", work: "Rue 2", airport: "" },
    });
    const id = await createCustomerSession("ada@example.com");

    const { GET } = await import("@/app/api/account/me/route");
    const response = await GET(meRequest(id));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual([
      "email",
      "language",
      "name",
      "preferences",
      "verifiedPhone",
    ]);
    expect(body.email).toBe("ada@example.com");
    expect(body.name).toBe("Ada");
    expect(body.verifiedPhone).toBe("+41791234567");
    expect(body.language).toBe("fr");
    expect(body.preferences).toEqual({
      whatsappOptIn: true,
      savedAddresses: { home: "Rue 1", work: "Rue 2", airport: "" },
    });
  });
});

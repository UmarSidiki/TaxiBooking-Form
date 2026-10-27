import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/lib/require-role", () => ({
  requireAdmin: async () => ({ ok: true }),
}));

afterAll(() => {
  vi.doUnmock("@/features/auth/lib/require-role");
  vi.resetModules();
});

describe("DELETE /api/admin/pricing", () => {
  it("saves and deletes a fixed route and a promo, and rejects bad input", async () => {
    const { DELETE } = await import("@/app/api/admin/pricing/route");
    const { connectDB } = await import("@/shared/db");
    const FixedRoute = (await import("@/features/pricing/model/FixedRoute")).default;
    const PromoCode = (await import("@/features/pricing/model/PromoCode")).default;
    await connectDB();
    const { POST } = await import("@/app/api/admin/pricing/route");
    const place = { label: "Airport", lat: 46.23, lng: 6.1, radiusKm: 2 };
    const saved = await POST(new Request("http://x/api/admin/pricing", { method: "POST", body: JSON.stringify({ kind: "route", from: [place], to: [{ ...place, label: "Centre", lat: 46.2 }], price: 40 }) }));
    expect(saved.status).toBe(200);
    const bad = await POST(new Request("http://x/api/admin/pricing", { method: "POST", body: JSON.stringify({ kind: "route", from: [], to: [place], price: 40 }) }));
    expect(bad.status).toBe(400);
    const zone = (await FixedRoute.findOne())!;
    const promo = await PromoCode.create({ code: "SAVE10", kind: "percent", amount: 10 });
    const call = (query: string) => DELETE(new Request(`http://x/api/admin/pricing?${query}`, { method: "DELETE" }));

    expect((await call(`kind=route&id=${zone._id}`)).status).toBe(200);
    expect(await FixedRoute.countDocuments()).toBe(0);
    expect((await call(`kind=promo&id=${promo._id}`)).status).toBe(200);
    expect(await PromoCode.countDocuments()).toBe(0);
    expect((await call(`kind=route&id=${zone._id}`)).status).toBe(404);
    expect((await call("kind=rule&id=abc")).status).toBe(400);
  });
});

import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/lib/require-role", () => ({
  requireAdmin: async () => ({ ok: true }),
}));

afterAll(() => {
  vi.doUnmock("@/features/auth/lib/require-role");
  vi.resetModules();
});

describe("DELETE /api/admin/pricing", () => {
  it("deletes a zone and a promo, and rejects bad input", async () => {
    const { DELETE } = await import("@/app/api/admin/pricing/route");
    const { connectDB } = await import("@/shared/db");
    const ZonePrice = (await import("@/features/pricing/model/ZonePrice")).default;
    const PromoCode = (await import("@/features/pricing/model/PromoCode")).default;
    await connectDB();
    const zone = await ZonePrice.create({ fromLabel: "Airport", toLabel: "City centre", price: 40 });
    const promo = await PromoCode.create({ code: "SAVE10", kind: "percent", amount: 10 });
    const call = (query: string) => DELETE(new Request(`http://x/api/admin/pricing?${query}`, { method: "DELETE" }));

    expect((await call(`kind=zone&id=${zone._id}`)).status).toBe(200);
    expect(await ZonePrice.countDocuments()).toBe(0);
    expect((await call(`kind=promo&id=${promo._id}`)).status).toBe(200);
    expect(await PromoCode.countDocuments()).toBe(0);
    expect((await call(`kind=zone&id=${zone._id}`)).status).toBe(404);
    expect((await call("kind=rule&id=abc")).status).toBe(400);
  });
});

import { describe, expect, it, vi } from "vitest";
import { fetchOsrmRoute } from "./osrm-route";

describe("fetchOsrmRoute", () => {
  it("returns geometry coordinates", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ routes: [{ geometry: { coordinates: [[6.1, 46.2], [6.2, 46.3]] } }] }),
    })) as any;
    const result = await fetchOsrmRoute([46.2, 6.1], [46.3, 6.2], fetchImpl);
    expect(result).toEqual([[46.2, 6.1], [46.3, 6.2]]);
  });

  it("falls back to null on error", async () => {
    const fetchImpl = vi.fn(async () => { throw new Error("boom"); }) as any;
    const result = await fetchOsrmRoute([46.2, 6.1], [46.3, 6.2], fetchImpl);
    expect(result).toBeNull();
  });
});
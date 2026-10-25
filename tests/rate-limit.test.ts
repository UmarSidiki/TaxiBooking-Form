import { describe, expect, it } from "vitest";
import { clientIp } from "@/shared/http/client-ip";
import { memoryLimit, resetMemoryLimits } from "@/shared/http/memory-limit";
import { mongoWindowLimit } from "@/shared/http/rate-window";
import { bookingAbuseReason } from "@/shared/http/booking-abuse";

describe("rate limits", () => {
  it("reads the client IP from the forwarded chain", () => {
    const request = new Request("http://local/api/booking", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1", "x-real-ip": "198.51.100.2" },
    });
    expect(clientIp(request)).toBe("203.0.113.5");
    expect(clientIp(new Request("http://local", { headers: { "x-real-ip": "198.51.100.2" } }))).toBe("198.51.100.2");
  });

  it("blocks in memory after the limit", () => {
    resetMemoryLimits();
    expect(memoryLimit("ip", 2, 60_000).ok).toBe(true);
    expect(memoryLimit("ip", 2, 60_000).ok).toBe(true);
    const blocked = memoryLimit("ip", 2, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("rejects a honeypot and a form filled too quickly", () => {
    expect(bookingAbuseReason({ companyWebsite: "http://spam" })).toBe("invalid_body");
    expect(bookingAbuseReason({ formStartedAt: Date.now() })).toBe("too_fast");
    expect(bookingAbuseReason({ formStartedAt: Date.now() - 10_000 })).toBeNull();
    expect(bookingAbuseReason({})).toBeNull();
  });

  it("counts a fixed window in Mongo", async () => {
    expect((await mongoWindowLimit("quote:1", 1)).ok).toBe(true);
    const again = await mongoWindowLimit("quote:1", 1);
    expect(again.ok).toBe(false);
  });
});

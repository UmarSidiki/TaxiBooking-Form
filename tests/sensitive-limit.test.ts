import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { limitSensitive } from "@/shared/http/sensitive-limit";
import { resetMemoryLimits } from "@/shared/http/memory-limit";

vi.mock("next-intl/middleware", () => ({ default: () => () => new Response(null) }));
vi.mock("next-intl/routing", () => ({ defineRouting: (config: unknown) => config }));

const { default: middleware } = await import("@/middleware");

const IP = "203.0.113.77";

function otpRequest(ip = IP) {
  return new Request("http://local/api/account/otp", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ email: "carrier-nat@example.com" }),
  });
}

function accountRequest(ip = IP) {
  return new NextRequest("http://local/api/account/otp", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

beforeEach(() => {
  resetMemoryLimits();
});

describe("per-IP OTP limit", () => {
  it("allows 20 OTP requests per IP per minute", async () => {
    for (let hit = 1; hit <= 20; hit += 1) {
      expect(await limitSensitive(otpRequest(), "otp")).toBeNull();
    }
    const blocked = await limitSensitive(otpRequest(), "otp");
    expect(blocked?.status).toBe(429);
    expect(Number(blocked?.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("gives each carrier NAT address its own bucket", async () => {
    for (let hit = 1; hit <= 20; hit += 1) {
      expect(await limitSensitive(otpRequest("198.51.100.10"), "otp")).toBeNull();
    }
    expect(await limitSensitive(otpRequest("198.51.100.11"), "otp")).toBeNull();
  });

  it("allows 20 account phone-code requests per IP in middleware", async () => {
    for (let hit = 1; hit <= 20; hit += 1) {
      expect(middleware(accountRequest()).status).not.toBe(429);
    }
    expect(middleware(accountRequest()).status).toBe(429);
  });
});

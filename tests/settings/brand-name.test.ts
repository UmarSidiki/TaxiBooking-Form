import { afterEach, describe, expect, it, vi } from "vitest";
import { brandName } from "@/features/settings/lib/brand-name";

describe("brandName", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("prefers the company name, trimmed", () => {
    expect(brandName({ companyName: "  Lakeside  ", smtpSenderName: "Mail" })).toBe("Lakeside");
  });

  it("falls back to the sender name, then the env site name", () => {
    vi.stubEnv("NEXT_PUBLIC_WEBSITE_NAME", "Env Taxi");
    expect(brandName({ companyName: " ", smtpSenderName: "Mail Co" })).toBe("Mail Co");
    expect(brandName(null)).toBe("Env Taxi");
  });

  it("is empty when nothing is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_WEBSITE_NAME", "");
    expect(brandName(undefined)).toBe("");
  });
});

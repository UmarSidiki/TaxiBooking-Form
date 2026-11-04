import { describe, expect, it } from "vitest";
import { brandIdentity } from "@/features/settings/lib/brand-identity";

describe("brandIdentity", () => {
  it("uses company name and trimmed logo", () => {
    expect(brandIdentity({ companyName: " Acme ", companyLogoUrl: " /logo.png " })).toEqual({ name: "Acme", logoUrl: "/logo.png", initial: "A" });
  });
  it("falls back to sender name, then the given fallback, with an initial", () => {
    expect(brandIdentity({ smtpSenderName: "zed" }).initial).toBe("Z");
    expect(brandIdentity(null, "Desk")).toEqual({ name: "Desk", logoUrl: "", initial: "D" });
  });
});

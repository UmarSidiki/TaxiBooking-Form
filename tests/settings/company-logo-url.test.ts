import { describe, expect, it } from "vitest";
import {
  companyLogoUrlSchema,
  settingsWriteSchema,
} from "@/features/settings/schema/settings-write.schema";

const DATA_URL_PREFIX = "data:image/png;base64,";

describe("company logo URL", () => {
  it("allows an empty value so the logo can be cleared", () => {
    expect(companyLogoUrlSchema.parse("")).toBe("");
    expect(companyLogoUrlSchema.parse("   ")).toBe("");
  });

  it("trims surrounding whitespace", () => {
    expect(companyLogoUrlSchema.parse("  https://cdn.example.com/logo.png  ")).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  it("accepts absolute http and https URLs", () => {
    expect(companyLogoUrlSchema.safeParse("https://cdn.example.com/logo.png").success).toBe(true);
    expect(companyLogoUrlSchema.safeParse("http://cdn.example.com/logo.png").success).toBe(true);
  });

  it("accepts same-origin paths", () => {
    expect(companyLogoUrlSchema.safeParse("/uploads/logo.png").success).toBe(true);
    expect(companyLogoUrlSchema.safeParse("/").success).toBe(true);
  });

  it.each(["png", "jpeg", "webp", "gif", "svg+xml"])("accepts base64 image data URLs (%s)", (type) => {
    const url = `data:image/${type};base64,PHN2Zz4=`;
    expect(companyLogoUrlSchema.safeParse(url).success).toBe(true);
  });

  it("rejects javascript: and other schemes", () => {
    expect(companyLogoUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(companyLogoUrlSchema.safeParse("data:text/html;base64,PHNjcmlwdD4=").success).toBe(false);
    expect(companyLogoUrlSchema.safeParse("ftp://cdn.example.com/logo.png").success).toBe(false);
    expect(companyLogoUrlSchema.safeParse("mailto:ops@example.com").success).toBe(false);
  });

  it("rejects relative and protocol-relative paths", () => {
    expect(companyLogoUrlSchema.safeParse("logo.png").success).toBe(false);
    expect(companyLogoUrlSchema.safeParse("//evil.example/logo.png").success).toBe(false);
    expect(companyLogoUrlSchema.safeParse("/\\evil.example/logo.png").success).toBe(false);
  });

  it("rejects malformed URLs and embedded whitespace", () => {
    expect(companyLogoUrlSchema.safeParse("https://").success).toBe(false);
    expect(companyLogoUrlSchema.safeParse("https://cdn.example.com/a b.png").success).toBe(false);
  });

  it("rejects values over 400000 characters", () => {
    expect(companyLogoUrlSchema.safeParse("a".repeat(400_001)).success).toBe(false);
  });

  it("is enforced by the settings write schema", () => {
    expect(settingsWriteSchema.safeParse({ companyLogoUrl: "" }).success).toBe(true);
    expect(
      settingsWriteSchema.safeParse({ companyLogoUrl: "https://cdn.example.com/logo.png" }).success,
    ).toBe(true);
    expect(settingsWriteSchema.safeParse({ companyLogoUrl: "javascript:alert(1)" }).success).toBe(
      false,
    );
  });

  it("accepts a data URL at the length limit", () => {
    const payload = "A".repeat(400_000 - DATA_URL_PREFIX.length);
    expect(companyLogoUrlSchema.safeParse(DATA_URL_PREFIX + payload).success).toBe(true);
  });
});

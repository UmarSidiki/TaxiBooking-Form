import { beforeAll, describe, expect, it } from "vitest";

import {
  readUnsubscribeToken,
  signUnsubscribeToken,
} from "@/features/marketing/lib/unsubscribe/unsubscribe-token";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET ||= "vitest-secret-not-for-production";
});

describe("unsubscribe token campaign tag", () => {
  it("round-trips the campaign id", () => {
    const token = signUnsubscribeToken({
      email: "A@Example.com",
      channel: "email",
      locale: "en",
      campaignId: "0123456789abcdef01234567",
    });
    expect(readUnsubscribeToken(token)).toEqual({
      email: "a@example.com",
      channel: "email",
      locale: "en",
      campaignId: "0123456789abcdef01234567",
    });
  });
  it("drops malformed ids and still reads old tokens", () => {
    const bad = signUnsubscribeToken({ email: "a@example.com", channel: "whatsapp", locale: "de", campaignId: "x" });
    expect(readUnsubscribeToken(bad)?.campaignId).toBeUndefined();
    const old = signUnsubscribeToken({ email: "a@example.com", channel: "email", locale: "en" });
    expect(readUnsubscribeToken(old)).toEqual({ email: "a@example.com", channel: "email", locale: "en" });
  });
});

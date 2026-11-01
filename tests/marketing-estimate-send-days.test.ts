import { describe, expect, it } from "vitest";

import { estimateSendDays } from "@/features/marketing/lib/campaigns/estimate-send-days";

describe("estimateSendDays", () => {
  it("uses the operator cap for WhatsApp", () => {
    expect(estimateSendDays(250, "whatsapp", 100)).toBe(3);
    expect(estimateSendDays(250, "whatsapp", 50)).toBe(5);
    expect(estimateSendDays(250, "whatsapp")).toBe(3);
    expect(estimateSendDays(5, "whatsapp", 0)).toBe(5);
  });
  it("email is a single day; zero recipients is zero", () => {
    expect(estimateSendDays(5000, "email", 10)).toBe(1);
    expect(estimateSendDays(0, "whatsapp", 100)).toBe(0);
  });
});

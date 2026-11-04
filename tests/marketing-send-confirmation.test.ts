import { describe, expect, it } from "vitest";

import { isMissingSendConfirmation } from "@/features/marketing/lib/campaigns/requires-confirmation";

describe("isMissingSendConfirmation", () => {
  it("only applies above 500 recipients", () => {
    expect(isMissingSendConfirmation(500, undefined)).toBe(false);
    expect(isMissingSendConfirmation(501, undefined)).toBe(true);
    expect(isMissingSendConfirmation(501, "send ")).toBe(false);
    expect(isMissingSendConfirmation(501, "SENT")).toBe(true);
  });
});

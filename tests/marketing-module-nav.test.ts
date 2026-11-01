import { describe, expect, it } from "vitest";

import { deskNavGroups } from "@/features/dashboard/lib/sidebar-nav";
import { isDeskNavFlagOn } from "@/features/dashboard/lib/is-desk-nav-flag-on";

const marketingGroup = deskNavGroups.find((group) => group.id === "marketing");

describe("Marketing module in the desk sidebar", () => {
  it("gates every Marketing entry on the marketing flag", () => {
    expect(marketingGroup?.items.length).toBe(3);
    for (const item of marketingGroup?.items ?? []) expect(item.flag).toBe("marketing");
  });

  it("is on when the field is missing or true, off only when false", () => {
    expect(isDeskNavFlagOn("marketing", {})).toBe(true);
    expect(isDeskNavFlagOn("marketing", { enableMarketing: true })).toBe(true);
    expect(isDeskNavFlagOn("marketing", { enableMarketing: false })).toBe(false);
  });
});

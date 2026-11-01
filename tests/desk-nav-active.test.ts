import { describe, expect, it } from "vitest";

import { deskNavGroups, isDeskNavItemActive } from "@/features/dashboard/lib/sidebar-nav";

const campaigns = "/en/dashboard/marketing/campaigns";

describe("isDeskNavItemActive", () => {
  it("highlights Campaigns on its wizard and report pages only", () => {
    expect(isDeskNavItemActive(campaigns, campaigns, true)).toBe(true);
    expect(isDeskNavItemActive(`${campaigns}/new`, campaigns, true)).toBe(true);
    expect(isDeskNavItemActive(`${campaigns}/abc123`, campaigns, true)).toBe(true);
    expect(isDeskNavItemActive(`${campaigns}x`, campaigns, true)).toBe(false);
    expect(isDeskNavItemActive(`${campaigns}/new`, "/en/dashboard/marketing", false)).toBe(false);
  });
  it("Campaigns entry opts into nested matching", () => {
    const item = deskNavGroups.flatMap((g) => g.items).find((i) => i.titleKey === "Sidebar.campaigns");
    expect(item?.matchNested).toBe(true);
  });
});

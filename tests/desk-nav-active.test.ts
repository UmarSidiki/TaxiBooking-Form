import { describe, expect, it } from "vitest";

import { activeDeskNavHref, deskNavGroups, isDeskNavItemActive } from "@/features/dashboard/lib/sidebar-nav";

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

describe("activeDeskNavHref", () => {
  const hrefs = deskNavGroups
    .flatMap((g) => g.items)
    .map((i) => ({ href: i.href("en"), matchNested: i.matchNested }));
  const cases: [string, string][] = [
    ["/en/dashboard/home", "/en/dashboard/home"],
    ["/en/dashboard/customers/abc", "/en/dashboard/customers"],
    ["/en/dashboard/customers/audit", "/en/dashboard/customers/audit"],
    ["/en/dashboard/marketing", "/en/dashboard/marketing"],
    ["/en/dashboard/marketing/campaigns/new", "/en/dashboard/marketing/campaigns"],
    ["/en/dashboard/settings/email", "/en/dashboard/settings"],
    ["/en/dashboard/settings/marketing", "/en/dashboard/settings/marketing"],
  ];
  it.each(cases)("%s lights exactly %s", (path, want) => {
    expect(activeDeskNavHref(path, hrefs)).toBe(want);
  });
  it("groups Marketing, Campaigns and marketing settings together", () => {
    const g = deskNavGroups.find((x) => x.id === "marketing");
    expect(g?.items.map((i) => i.titleKey)).toEqual([
      "Sidebar.marketing_overview",
      "Sidebar.campaigns",
      "Sidebar.marketing_settings",
    ]);
  });
});

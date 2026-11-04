import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import en from "../messages/en.json";
import { UpcomingRideCard } from "@/features/customers/ui/upcoming-ride-card";
import { AccountPastRides } from "@/features/customers/ui/account-past-rides";
import type { AccountT, Ride } from "@/features/customers/ui/account-types";

const accountCopy = (en as { Account: Record<string, string> }).Account;

const t: AccountT = (key, values) => {
  const template = accountCopy[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, token: string) =>
    String(values?.[token] ?? ""),
  );
};

const upcomingRide: Ride = {
  tripId: "RV-24817",
  pickup: "Geneva Airport (GVA)",
  dropoff: "Beau-Rivage Palace, Lausanne",
  date: "2026-11-07",
  time: "14:30",
  status: "upcoming",
  totalAmount: 245,
  passengers: 2,
  paymentMethod: "stripe",
  paymentStatus: "completed",
  vehicleDetails: { name: "Mercedes-Benz E-Class", seats: "3" },
};

const heroProps = {
  t,
  locale: "en",
  currency: "CHF",
  cancelPolicy: [{ hoursBefore: 24, feePercent: 0 }],
  onChange: () => undefined,
  onCancel: () => undefined,
};

describe("account home", () => {
  it("renders the upcoming ride hero", () => {
    const html = renderToStaticMarkup(
      <UpcomingRideCard ride={upcomingRide} {...heroProps} />,
    );

    expect(html).toContain("Upcoming ride");
    expect(html).toContain("RV-24817");
    expect(html).toContain("7 November");
    expect(html).toContain("14:30");
    expect(html).toContain("Geneva Airport (GVA)");
    expect(html).toContain("Beau-Rivage Palace, Lausanne");
    expect(html).toContain("Mercedes-Benz E-Class");
    expect(html).toContain("To be assigned");
    expect(html).toMatch(/CHF\s245\.00/);
    expect(html).toContain("Paid");
    expect(html).toContain("/api/invoice/RV-24817");
    expect(html).toContain("Change");
    expect(html).toContain("Cancel");
    expect(html).toContain("Free cancellation until");
  });

  it("renders the empty upcoming state with a booking link", () => {
    const html = renderToStaticMarkup(
      <UpcomingRideCard ride={null} {...heroProps} />,
    );

    expect(html).toContain("No upcoming rides");
    expect(html).toContain("Book a ride");
    expect(html).toContain('href="/en"');
  });

  it("renders the past rides list with receipt and rebook actions", () => {
    const past: Ride[] = [
      {
        tripId: "RV-1",
        pickup: "Geneva Airport (GVA)",
        dropoff: "Hôtel des Bergues",
        date: "2026-10-15",
        time: "09:10",
        status: "completed",
        totalAmount: 95,
        vehicleDetails: { name: "Mercedes V-Class" },
      },
      {
        tripId: "RV-2",
        pickup: "Rue du Rhône 42",
        dropoff: "Geneva Airport (GVA)",
        date: "2026-09-26",
        time: "18:45",
        status: "completed",
        totalAmount: 85,
        vehicleDetails: { name: "Mercedes-Benz E-Class" },
      },
    ];

    const html = renderToStaticMarkup(
      <AccountPastRides rides={past} t={t} locale="en" currency="CHF" />,
    );

    expect(html).toContain("Past rides");
    expect(html).toContain("15 Oct 2026");
    expect(html).toContain("Geneva Airport (GVA)");
    expect(html).toContain("Hôtel des Bergues");
    expect(html).toMatch(/CHF\s95\.00/);
    expect(html).toContain("/api/invoice/RV-1");
    expect(html).toContain("Receipt");
    expect(html).toContain("Rebook");
  });

  it("renders the empty past rides state", () => {
    const html = renderToStaticMarkup(
      <AccountPastRides rides={[]} t={t} locale="en" currency="CHF" />,
    );

    expect(html).toContain("No past rides yet");
    expect(html).toContain("Your completed trips and receipts will appear here.");
  });
});

describe("account home copy", () => {
  const LOCALES = ["en", "fr", "es", "de", "nl", "it", "ru", "ar"] as const;
  const REQUIRED = [
    "nav-home",
    "nav-rides",
    "nav-account",
    "signed-in-as",
    "account-menu-label",
    "greeting-morning",
    "greeting-afternoon",
    "greeting-evening",
    "greeting-subtitle",
    "upcoming-ride",
    "trip-meta",
    "route-join",
    "to-be-assigned",
    "to-be-assigned-note",
    "driver-assigned-note",
    "fare",
    "fare-paid",
    "fare-awaiting",
    "pay-card",
    "pay-cash",
    "passengers-line",
    "seats-line",
    "free-cancellation-until",
    "no-upcoming-title",
    "no-upcoming-copy",
    "quick-actions",
    "rebook-last-route",
    "rebook-new-route",
    "saved-places",
    "saved-places-count",
    "saved-places-none",
    "whatsapp-chat",
    "security-sessions",
    "concierge",
    "concierge-copy",
    "concierge-message",
    "past-rides",
    "view-all",
    "show-less",
    "receipt",
    "past-empty-title",
    "past-empty-copy",
    "ride-meta",
    "security",
    "security-copy",
  ];

  for (const locale of LOCALES) {
    it(`${locale} has every account home string`, () => {
      const json = JSON.parse(
        readFileSync(`messages/${locale}.json`, "utf8"),
      ) as { Account?: Record<string, string> };
      const account = json.Account ?? {};
      const missing = REQUIRED.filter(
        (key) => typeof account[key] !== "string" || account[key].trim() === "",
      );

      expect(missing).toEqual([]);
      expect(account["trip-meta"]).toContain("{id}");
      expect(account["trip-meta"]).toContain("{route}");
      expect(account["route-join"]).toContain("{pickup}");
      expect(account["route-join"]).toContain("{dropoff}");
    });
  }
});

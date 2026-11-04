import { describe, expect, it } from "vitest";

import { buildRideDispatchEmailPayload } from "@/features/booking/lib/build-ride-dispatch-email";
import type { IBooking } from "@/features/booking/model";
import { emailTranslator } from "@/features/emails/lib/email-messages";
import { renderEmail } from "@/features/emails/lib/render-email";
import { sampleBrand } from "@/features/emails/lib/sample-brand";
import { AssigneeEmail } from "@/features/emails/templates/assignee-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";
import { LocationLinks } from "@/features/emails/ui/location-links";
import {
  formatCoords,
  mapsDirectionsUrl,
  mapsSearchUrl,
  rideLocationsOf,
  rideLocationsText,
  validCoords,
} from "@/features/rides/lib/ride-locations";
import { deliverAssigneeNotice, type OutboundText } from "@/features/settings/lib/assignee-whatsapp";
import { Setting } from "@/features/settings/model";
import { createRide, createVehicle, saveDispatchSettings } from "./helpers/fixtures";

const GENEVA = { lat: 46.2380651234, lng: 6.1089563 };
const HOTEL = { lat: 46.2097, lng: 6.1527 };
const ride = {
  pickup: "Geneva Airport",
  pickupLatLng: GENEVA,
  dropoff: "Quai du Mont-Blanc 13, Genève",
  dropoffLatLng: HOTEL,
  stops: [
    { location: "Second <stop> & co", order: 2 },
    { location: "First stop", order: 1, latLng: { lat: 46.2, lng: 6.14 } },
  ],
};

describe("ride map links helper", () => {
  it("formats coordinates to 6 decimals and links to the coordinates", () => {
    expect(formatCoords(GENEVA)).toBe("46.238065, 6.108956");
    expect(mapsSearchUrl("Geneva Airport", GENEVA)).toBe(
      "https://www.google.com/maps/search/?api=1&query=46.238065%2C6.108956",
    );
    expect(mapsDirectionsUrl("x", GENEVA)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=46.238065%2C6.108956",
    );
  });

  it("falls back to an encoded address query when coordinates are missing or invalid", () => {
    expect(mapsSearchUrl("Rue de Lausanne 1 & 2, Genève")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Rue%20de%20Lausanne%201%20%26%202%2C%20Gen%C3%A8ve",
    );
    expect(validCoords({ lat: 91, lng: 0 })).toBeNull();
    expect(validCoords({ lat: Number.NaN, lng: 0 })).toBeNull();
    expect(validCoords(null)).toBeNull();
    expect(mapsSearchUrl("Dock", { lat: 200, lng: 0 })).toContain("query=Dock");
  });

  it("lists pickup, stops in order, and drop-off", () => {
    const places = rideLocationsOf(ride);
    expect(places.map((place) => [place.kind, place.number ?? null, place.address])).toEqual([
      ["pickup", null, "Geneva Airport"],
      ["stop", 1, "First stop"],
      ["stop", 2, "Second <stop> & co"],
      ["dropoff", null, "Quai du Mont-Blanc 13, Genève"],
    ]);
    expect(places[2]?.coords).toBeNull();
    expect(places[2]?.mapsUrl).toContain("query=Second%20%3Cstop%3E%20%26%20co");
  });

  it("gives hourly rides a pickup only and skips placeholder drop-offs", () => {
    expect(rideLocationsOf({ ...ride, bookingType: "hourly" }).map((p) => p.kind)).toEqual(["pickup"]);
    expect(rideLocationsOf({ pickup: "A", dropoff: "N/A" }).map((p) => p.kind)).toEqual(["pickup"]);
  });

  it("builds a WhatsApp block with addresses, coordinates when known, and links", () => {
    const text = rideLocationsText(rideLocationsOf(ride));
    expect(text).toContain("🟢 Geneva Airport\n📍 46.238065, 6.108956\nhttps://www.google.com/maps/search/?api=1&query=46.238065%2C6.108956");
    expect(text).toContain("🔵 2. Second <stop> & co\nhttps://www.google.com/maps/search/?api=1&query=Second");
    expect(text).toContain("🏁 Quai du Mont-Blanc 13, Genève\n📍 46.209700, 6.152700");
  });
});

describe("driver and partner emails", () => {
  const t = emailTranslator("en");
  const trip = { tripId: "T-1", pickup: ride.pickup, dropoff: ride.dropoff, date: "2026-11-04", time: "14:30" };

  it("assignee email shows coordinates and maps links in HTML and plain text", async () => {
    const { html, text } = await renderEmail(
      <AssigneeEmail
        t={t}
        brand={sampleBrand}
        locale="en"
        subject="Ride assigned"
        intro="A ride is yours"
        trip={trip}
        status={{ label: "Assigned", tone: "info" }}
        locations={rideLocationsOf(ride)}
      />,
    );
    expect(html).toContain("Map links");
    expect(html).toContain("46.238065, 6.108956");
    expect(html).toContain('href="https://www.google.com/maps/search/?api=1&amp;query=46.238065%2C6.108956"');
    expect(html).toContain('href="https://www.google.com/maps/dir/?api=1&amp;destination=46.209700%2C6.152700"');
    expect(html).toContain("Second &lt;stop&gt; &amp; co");
    expect(html).not.toContain("<stop>");
    expect(text).toContain("46.238065, 6.108956");
    expect(text).toContain("https://www.google.com/maps/search/?api=1&query=46.238065%2C6.108956");
  });

  it("partner notice email renders the links through the extra slot, in the email locale", async () => {
    const { html } = await renderEmail(
      <NoticeEmail
        t={emailTranslator("fr")}
        brand={sampleBrand}
        locale="fr"
        subject="Course"
        intro="Disponible"
        trip={trip}
        extra={<LocationLinks locations={rideLocationsOf({ pickup: "Gare" })} t={emailTranslator("fr")} />}
      />,
    );
    expect(html).toContain("Liens de carte");
    expect(html).toContain("Ouvrir dans Maps");
    expect(html).toContain("query=Gare");
  });

  it("renders nothing extra when there are no locations", async () => {
    const { html } = await renderEmail(
      <AssigneeEmail t={t} brand={sampleBrand} locale="en" subject="s" intro="i" trip={trip} status={{ label: "x", tone: "info" }} />,
    );
    expect(html).not.toContain("Map links");
  });

  it("dispatch payload carries locations built from the booking", () => {
    const payload = buildRideDispatchEmailPayload(
      { ...ride, tripId: "T", tripType: "oneway", date: "d", time: "t" } as unknown as IBooking,
      { name: "Nia", email: "nia@example.com" },
      10,
    );
    expect(payload.locations.map((place) => place.kind)).toEqual(["pickup", "stop", "stop", "dropoff"]);
    expect(payload.locations[0]?.coords).toEqual(GENEVA);
  });
});

describe("booking coordinates and WhatsApp", () => {
  it("persists pickup, stop and drop-off coordinates on the booking", async () => {
    const vehicle = await createVehicle();
    const saved = await createRide({ selectedVehicle: vehicle._id, ...ride });
    const stored = rideLocationsOf(saved.toObject());
    expect(stored.map((place) => place.coords)).toEqual([GENEVA, { lat: 46.2, lng: 6.14 }, null, HOTEL]);
  });

  it("appends the map links to assignee WhatsApp messages", async () => {
    await saveDispatchSettings({});
    await Setting.updateOne({}, { $set: { whatsappTplAssigned: true } });
    const sent: OutboundText[][] = [];
    const result = await deliverAssigneeNotice(
      {
        kind: "assigned",
        recipients: [{ phone: "+1 415 555 2671", name: "Nia" }],
        ride: { tripId: "T1", pickup: "Airport", date: "2026-06-20", time: "09:00", locations: rideLocationsOf(ride) },
      },
      {
        linked: async () => true,
        send: async (messages) => {
          sent.push(messages);
          return { ok: true };
        },
      },
    );
    expect(result.reason).toBe("sent");
    const text = sent[0]?.[0]?.text ?? "";
    expect(text.startsWith("Ride T1 is assigned to you. Airport on 2026-06-20 at 09:00.\n\n🟢 Geneva Airport")).toBe(true);
    expect(text).toContain("📍 46.238065, 6.108956");
    expect(text).toContain("https://www.google.com/maps/search/?api=1&query=46.209700%2C6.152700");
  });
});

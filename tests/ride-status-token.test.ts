import { createHmac } from "node:crypto";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Booking } from "@/features/booking/model";
import { signCustomerToken } from "@/features/customers/lib/customer-token";
import { readRideStatusToken, rideStatusUrl } from "@/features/customers/lib/ride-status-url";
import { createRide } from "./helpers/fixtures";

const SECRET = "test-secret";
const PURPOSE = "ride_status";
const now = () => Math.floor(Date.now() / 1000);

function forge(payload: Record<string, unknown>, purpose = PURPOSE) {
  const key = createHmac("sha256", SECRET).update(`purpose:${purpose}`).digest();
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${sig}`;
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = SECRET;
});

describe("ride-status tokens", () => {
  it("turns a fresh link into the ride it was issued for", async () => {
    const ride = await createRide({ selectedVehicle: new mongoose.Types.ObjectId() });
    const url = await rideStatusUrl("fr", ride.tripId, "https://example.com");
    const token = new URL(url).searchParams.get("token");

    const parsed = readRideStatusToken(token);
    expect(parsed).toEqual({ locale: "fr", tripId: ride.tripId });

    const found = await Booking.findOne({ tripId: parsed?.tripId }).lean();
    expect(found?.pickup).toBe("Airport");
  });

  it("rejects a tampered signature", () => {
    const token = forge({ p: PURPOSE, l: "en", t: "trip-1", exp: now() + 60 });
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(readRideStatusToken(tampered)).toBeNull();
  });

  it("rejects an expired token", () => {
    expect(readRideStatusToken(signCustomerToken(PURPOSE, { l: "en", t: "trip-1" }, -1))).toBeNull();
  });

  it("rejects a signed token whose expiry is not an integer", () => {
    for (const exp of ["soon", null, 1.5, Number.NaN]) {
      expect(readRideStatusToken(forge({ p: PURPOSE, l: "en", t: "trip-1", exp }))).toBeNull();
    }
  });

  it("rejects a token minted for another purpose", () => {
    const other = signCustomerToken("login", { l: "en", t: "trip-1" }, 60);
    expect(readRideStatusToken(other)).toBeNull();

    const relabeled = forge({ p: "login", l: "en", t: "trip-1", exp: now() + 60 });
    expect(readRideStatusToken(relabeled)).toBeNull();
  });

  it("keeps legacy links on the expired screen", () => {
    const body = Buffer.from(`en|trip-1|${now() + 60}`).toString("base64url");
    const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
    expect(readRideStatusToken(`${body}.${sig}`)).toBeNull();
  });
});

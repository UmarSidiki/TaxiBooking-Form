import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Booking } from "@/features/booking/model";
import { createBookingDocument } from "@/features/booking/lib/booking.repo";
import { patchBooking } from "@/features/booking/lib/patch-booking.service";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import { CustomerStats } from "@/features/customers-admin/model";
import {
  aggregateCustomerStats,
  toCustomerStatsRow,
} from "@/features/customers-admin/lib/customer-stats/aggregate-customer-stats";
import {
  loadProfilesFor,
  STATS_BOOKING_FIELDS,
  withProfileDefaults,
} from "@/features/customers-admin/lib/customer-stats/customer-stats.repo";
import { rebuildCustomerStats } from "@/features/customers-admin/lib/customer-stats/rebuild-customer-stats";
import { refreshCustomerStatsForEmail } from "@/features/customers-admin/lib/customer-stats/refresh-customer-stats";
import { isLocalMongoUri } from "@/features/customers-admin/lib/customer-stats/is-local-mongo-uri";
import type {
  CustomerStatsBooking,
  CustomerStatsRow,
} from "@/features/customers-admin/lib/customer-stats/customer-stats.types";
import { runNightlyCustomerStats } from "@/features/cron/lib/run-cron";
import { createRide, createVehicle } from "./helpers/fixtures";

const ACTOR = { id: "admin-1", role: "admin" as const };

function storedRow(doc: CustomerStatsRow): CustomerStatsRow {
  return {
    emailLower: doc.emailLower,
    name: doc.name,
    phoneDigits: doc.phoneDigits,
    verifiedPhone: doc.verifiedPhone,
    rideCount: doc.rideCount,
    completedCount: doc.completedCount,
    totalSpendMinor: doc.totalSpendMinor,
    currency: doc.currency,
    firstRideAt: doc.firstRideAt,
    lastRideAt: doc.lastRideAt,
    hasUpcoming: doc.hasUpcoming,
    locale: doc.locale,
  };
}

afterEach(() => {
  delete process.env.QA_MOCK_EMAIL;
});

describe("customer stats aggregation", () => {
  it("rebuilds exactly what live aggregation of the seeded bookings returns", async () => {
    const vehicle = await createVehicle();
    await CustomerProfile.create({
      email: "ada@example.com",
      name: "Ada Lovelace",
      verifiedPhone: "41791234567",
      language: "fr",
    });

    await createRide({
      selectedVehicle: vehicle._id,
      email: "Ada@Example.com",
      status: "completed",
      paymentStatus: "completed",
      totalAmount: 42.5,
      amountPaidCents: 4250,
      date: "2026-01-10",
      time: "09:30",
    });
    await createRide({
      selectedVehicle: vehicle._id,
      email: "ada@example.com",
      status: "upcoming",
      paymentStatus: "completed",
      totalAmount: 100,
      date: "2026-02-01",
      time: "10:00",
    });
    await createRide({
      selectedVehicle: vehicle._id,
      email: "ada@example.com",
      status: "canceled",
      totalAmount: 50,
      date: "2026-03-01",
      time: "10:00",
    });
    await createRide({
      selectedVehicle: vehicle._id,
      email: "bob@example.com",
      status: "completed",
      paymentStatus: "completed",
      amountPaidCents: 10000,
      amountRefundedCents: 2500,
      totalAmount: 100,
      date: "2026-01-20",
      time: "12:00",
    });
    await createRide({
      selectedVehicle: vehicle._id,
      email: "bob@example.com",
      status: "requested",
      paymentStatus: "pending",
      totalAmount: 70,
      date: "2026-02-10",
      time: "08:00",
    });

    const result = await rebuildCustomerStats();
    expect(result).toMatchObject({ dryRun: false, emails: 2, rowsWritten: 2, staleRemoved: 0 });

    const bookings = await Booking.find()
      .select(STATS_BOOKING_FIELDS)
      .lean<CustomerStatsBooking[]>();
    const live = aggregateCustomerStats(bookings, "EUR");
    const profiles = await loadProfilesFor(live.map((row) => row.emailLower));
    const expected = live.map((row) =>
      storedRow(withProfileDefaults(toCustomerStatsRow(row), profiles.get(row.emailLower))),
    );

    const stored = await CustomerStats.find().sort({ emailLower: 1 }).lean();
    expect(stored.map(storedRow)).toEqual(expected);

    const ada = expected.find((row) => row.emailLower === "ada@example.com");
    expect(ada).toMatchObject({
      rideCount: 2,
      completedCount: 1,
      totalSpendMinor: 14250,
      currency: "EUR",
      hasUpcoming: true,
      verifiedPhone: "41791234567",
      locale: "fr",
    });
    expect(ada?.firstRideAt?.toISOString()).toBe("2026-01-10T09:30:00.000Z");
    expect(ada?.lastRideAt?.toISOString()).toBe("2026-01-10T09:30:00.000Z");

    const bob = expected.find((row) => row.emailLower === "bob@example.com");
    expect(bob).toMatchObject({ rideCount: 1, completedCount: 1, totalSpendMinor: 7500 });
  });

  it("keeps stat queries regex-free", () => {
    const root = path.resolve(process.cwd(), "src/features/customers-admin");
    const files = readdirSync(root, { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(path.join(root, file), "utf8");
      expect(source, file).not.toMatch(/\$regex|new RegExp|\.regex\(/);
    }
  });

  it("declares the indexes the admin list will sort and search on", () => {
    const indexes = CustomerStats.schema.indexes() as Array<
      [Record<string, number>, { unique?: boolean }]
    >;
    const keys = indexes.map(([fields]) => Object.keys(fields).join(","));
    expect(keys).toEqual(
      expect.arrayContaining([
        "emailLower",
        "lastRideAt",
        "totalSpendMinor",
        "rideCount",
        "phoneDigits",
      ]),
    );
    const uniqueEmail = indexes.find(
      ([fields, options]) =>
        Object.keys(fields).length === 1 && fields.emailLower === 1 && options.unique === true,
    );
    expect(uniqueEmail).toBeDefined();
  });
});

describe("customer stats incremental updates", () => {
  it("updates on booking create, complete, and cancel", async () => {
    process.env.QA_MOCK_EMAIL = "1";
    const vehicle = await createVehicle();
    const booking = await createBookingDocument({
      tripId: "stats-inc-1",
      pickup: "Airport",
      dropoff: "Hotel",
      tripType: "oneway",
      date: "2026-12-01",
      time: "10:00",
      passengers: 1,
      selectedVehicle: vehicle._id,
      firstName: "Ada",
      lastName: "Lovelace",
      email: "Ada@Example.com",
      phone: "+41 79 123 45 67",
      paymentMethod: "stripe",
      paymentStatus: "completed",
      status: "upcoming",
      totalAmount: 80,
      amountPaidCents: 8000,
    });

    expect(await CustomerStats.findOne({ emailLower: "ada@example.com" }).lean()).toMatchObject({
      rideCount: 1,
      completedCount: 0,
      totalSpendMinor: 8000,
      hasUpcoming: true,
      phoneDigits: "41791234567",
    });

    const completed = await patchBooking(
      String(booking._id),
      { action: "complete" },
      "http://127.0.0.1:3000",
      ACTOR,
    );
    expect(completed.ok).toBe(true);
    expect(await CustomerStats.findOne({ emailLower: "ada@example.com" }).lean()).toMatchObject({
      rideCount: 1,
      completedCount: 1,
      totalSpendMinor: 8000,
      hasUpcoming: false,
    });

    const canceled = await patchBooking(
      String(booking._id),
      { action: "cancel" },
      "http://127.0.0.1:3000",
      ACTOR,
    );
    expect(canceled.ok).toBe(true);
    expect(await CustomerStats.findOne({ emailLower: "ada@example.com" }).lean()).toMatchObject({
      rideCount: 0,
      completedCount: 0,
      totalSpendMinor: 0,
      hasUpcoming: false,
    });
  });

  it("recomputes one customer case-insensitively and removes empty rows", async () => {
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      email: "MiXeD@Example.com",
      status: "completed",
      totalAmount: 10,
    });

    await refreshCustomerStatsForEmail("mixed@example.com");
    expect(await CustomerStats.findOne({ emailLower: "mixed@example.com" }).lean()).toMatchObject({
      rideCount: 1,
      completedCount: 1,
      totalSpendMinor: 1000,
    });

    await Booking.deleteMany({ email: "MiXeD@Example.com" });
    await refreshCustomerStatsForEmail("mixed@example.com");
    expect(await CustomerStats.exists({ emailLower: "mixed@example.com" })).toBeNull();
  });
});

describe("customer stats rebuild job", () => {
  it("is dry-run first and prunes rows that no longer have bookings", async () => {
    const vehicle = await createVehicle();
    await createRide({ selectedVehicle: vehicle._id, email: "dry@example.com" });
    await CustomerStats.create({ emailLower: "ghost@example.com", rebuiltAt: new Date(0) });

    const preview = await rebuildCustomerStats({ dryRun: true });
    expect(preview).toMatchObject({ dryRun: true, emails: 1, rowsWritten: 0 });
    expect(await CustomerStats.countDocuments()).toBe(1);

    const applied = await rebuildCustomerStats();
    expect(applied).toMatchObject({ emails: 1, rowsWritten: 1, staleRemoved: 1 });
    expect(await CustomerStats.exists({ emailLower: "ghost@example.com" })).toBeNull();
  });

  it("is callable from the daily cron pass", async () => {
    const vehicle = await createVehicle();
    await createRide({ selectedVehicle: vehicle._id, email: "cron@example.com" });

    expect(await runNightlyCustomerStats()).toBe(1);
    expect(await CustomerStats.findOne({ emailLower: "cron@example.com" }).lean()).toMatchObject({
      rideCount: 1,
    });
  });

  it("refuses remote database URIs for the backfill script", () => {
    expect(isLocalMongoUri("mongodb://127.0.0.1:27017/booking")).toBe(true);
    expect(isLocalMongoUri("mongodb://localhost:27017/booking")).toBe(true);
    expect(isLocalMongoUri("mongodb://[::1]:27017/booking")).toBe(true);
    expect(isLocalMongoUri("mongodb://user:pass@127.0.0.1:27017/booking")).toBe(true);
    expect(isLocalMongoUri("mongodb://db.example.com:27017/booking")).toBe(false);
    expect(isLocalMongoUri("mongodb+srv://cluster.example.com/booking")).toBe(false);
    expect(isLocalMongoUri("")).toBe(false);
    expect(isLocalMongoUri(undefined)).toBe(false);
  });
});

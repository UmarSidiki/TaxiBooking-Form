import { describe, expect, it } from "vitest";
import {
  depositConfigFromRule,
  depositPercentForMethod,
} from "@/features/pricing/lib/deposit-percent";
import { refundableDepositCents } from "@/features/payments/lib/refundable-deposit";
import { buildPaidBookingRecord } from "@/features/payments/lib/build-paid-booking-record";
import type { IPendingBooking } from "@/features/booking/model/PendingBooking";

const rule = {
  depositPercent: 20,
  cashDepositEnabled: true,
  cashDepositPercent: 30,
  appointmentDepositEnabled: true,
  appointmentDepositPercent: 10,
};

const pending = (overrides: Partial<IPendingBooking>): IPendingBooking =>
  ({
    orderId: "ord_1",
    draftId: "draft_1",
    purpose: "booking",
    paymentMethod: "stripe",
    status: "open",
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    bookingData: {
      pickup: "Airport",
      dropoff: "Hotel",
      tripType: "oneway",
      date: "2026-12-01",
      time: "10:00",
      passengers: 2,
      selectedVehicle: "veh_1",
      childSeats: 0,
      babySeats: 0,
      notes: "",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+14155552671",
      totalAmount: 100,
      subtotalAmount: 100,
      taxAmount: 0,
      taxPercentage: 0,
      depositDue: 30,
      balanceDue: 70,
    },
    ...overrides,
  }) as IPendingBooking;

const vehicle = { name: "Sedan", price: 10, persons: 4 };

describe("depositPercentForMethod", () => {
  it("uses a separate percentage for cash and appointment", () => {
    expect(depositPercentForMethod(rule, "card")).toBe(20);
    expect(depositPercentForMethod(rule, "multisafepay")).toBe(20);
    expect(depositPercentForMethod(rule, "cash")).toBe(30);
    expect(depositPercentForMethod(rule, "appointment")).toBe(10);
  });

  it("returns zero when the method-specific toggle is off", () => {
    expect(
      depositPercentForMethod({ ...rule, cashDepositEnabled: false }, "cash"),
    ).toBe(0);
    expect(
      depositPercentForMethod(
        { ...rule, appointmentDepositEnabled: false },
        "appointment",
      ),
    ).toBe(0);
  });

  it("exposes the config for the wizard", () => {
    expect(depositConfigFromRule(rule)).toEqual({
      cash: { enabled: true, percent: 30 },
      appointment: { enabled: true, percent: 10 },
    });
  });
});

describe("buildPaidBookingRecord for deposits", () => {
  it("creates a cash booking with the deposit paid and balance in cash", () => {
    const record = buildPaidBookingRecord("ord_1", pending({ purpose: "cash_deposit", paymentMethod: "cash" }), vehicle, {
      paymentMethod: "stripe",
      paidAmount: 30,
      currency: "EUR",
      stripePaymentIntentId: "pi_1",
    });

    expect(record.paymentMethod).toBe("cash");
    expect(record.status).toBe("upcoming");
    expect(record.paymentStatus).toBe("completed");
    expect(record.amountPaidCents).toBe(3000);
    expect(record.depositPaidCents).toBe(3000);
    expect(record.depositPaymentIntentId).toBe("pi_1");
    expect(record.depositDue).toBe(30);
    expect(record.balanceDue).toBe(70);
  });

  it("creates an appointment request with the deposit paid", () => {
    const record = buildPaidBookingRecord("ord_1", pending({ purpose: "appointment_deposit", paymentMethod: "unpaid" }), vehicle, {
      paymentMethod: "stripe",
      paidAmount: 15,
      currency: "EUR",
      stripePaymentIntentId: "pi_2",
    });

    expect(record.paymentMethod).toBe("unpaid");
    expect(record.status).toBe("requested");
    expect(record.paymentStatus).toBe("completed");
    expect(record.depositPaidCents).toBe(1500);
    expect(record.estimatedAmount).toBe(100);
  });
});

describe("refundableDepositCents", () => {
  it("caps at the paid deposit and subtracts earlier refunds", () => {
    expect(refundableDepositCents({ depositPaidCents: 3000 })).toBe(3000);
    expect(
      refundableDepositCents({ depositPaidCents: 3000, amountRefundedCents: 1000 }),
    ).toBe(2000);
    expect(refundableDepositCents({ depositPaidCents: 0 })).toBe(0);
  });
});

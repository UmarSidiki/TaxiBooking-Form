import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { Setting } from "@/features/settings/model";
import { PendingBooking, Booking } from "@/features/booking/model";
import { createVehicle } from "./helpers/fixtures";
import { createCashBooking } from "@/features/booking/lib/create-cash-booking.service";
import { shouldOpenCardSession } from "@/features/payments/lib/checkout/should-open-card-session";
import type { CashBookingInput } from "@/features/booking/schema/cash-booking.schema";
import { POST as openSession } from "@/app/api/checkout/session/route";
import { POST as cancelSession } from "@/app/api/checkout/cancel/route";
import { POST as createBookingRoute } from "@/app/api/booking/route";
import { GET as paymentStatus } from "@/app/api/payment-status/route";
import { POST as stripeWebhook } from "@/app/api/stripe-webhook/route";

const mocks = vi.hoisted(() => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      cancel: vi.fn(),
    },
    paymentMethodDomains: { create: vi.fn() },
  },
}));

vi.mock("@/features/payments/lib/stripe-client", () => ({
  getStripeClient: vi.fn(async () => mocks.stripe),
  getStripeApiVersion: () => "2026-07-29.dahlia",
  getPaidAmountFromPaymentIntent: (intent: { amount_received?: number; amount: number }) =>
    (intent.amount_received ?? intent.amount) / 100,
}));

let vehicleId = "";

const BODY = {
  bookingType: "hourly" as const,
  duration: 2,
  pickup: "Airport",
  dropoff: "Hotel",
  tripType: "oneway" as const,
  date: "2026-12-01",
  time: "10:00",
  passengers: 2,
  childSeats: 0,
  babySeats: 0,
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+14155552671",
  notes: "",
};

function paymentIntent(amount: number, status = "requires_payment_method") {
  return {
    id: "pi_1",
    client_secret: "cs_1",
    amount,
    currency: "eur",
    status,
    metadata: {},
  };
}

async function sessionRequest(draftId: string, overrides: Record<string, unknown> = {}) {
  const request = new NextRequest("http://localhost/api/checkout/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      draftId,
      customerEmail: "ada@example.com",
      bookingData: { ...BODY, selectedVehicle: vehicleId, ...overrides },
    }),
  });
  const response = await openSession(request);
  return { status: response.status, body: await response.json() };
}

async function cancelRequest(draftId: string) {
  const request = new NextRequest("http://localhost/api/checkout/cancel", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ draftId }),
  });
  const response = await cancelSession(request);
  return { status: response.status, body: await response.json() };
}

beforeEach(async () => {
  vi.clearAllMocks();
  const vehicle = await createVehicle();
  vehicleId = String(vehicle._id);
  await Setting.create({
    acceptedPaymentMethods: ["card", "cash"],
    stripeCurrency: "eur",
    stripeSecretKey: "sk_test",
  });

  mocks.stripe.paymentIntents.create.mockImplementation(
    async (params: { amount: number; currency: string }) =>
      paymentIntent(params.amount)
  );
  mocks.stripe.paymentIntents.retrieve.mockResolvedValue(paymentIntent(6000));
  mocks.stripe.paymentIntents.update.mockImplementation(
    async (_id: string, params: { amount: number }) => paymentIntent(params.amount)
  );
  mocks.stripe.paymentIntents.cancel.mockResolvedValue(paymentIntent(6000, "canceled"));
});

describe("card checkout session", () => {
  it("creates zero PaymentIntents while no payment method is chosen", () => {
    expect(
      shouldOpenCardSession({
        method: "",
        appointmentOnly: false,
        enabled: true,
        quoteReady: true,
        dueNow: 60,
        hasSecret: false,
        creating: false,
        initialized: false,
      })
    ).toBe(false);
    expect(
      shouldOpenCardSession({
        method: "card",
        appointmentOnly: false,
        enabled: true,
        quoteReady: true,
        dueNow: 60,
        hasSecret: false,
        creating: false,
        initialized: false,
      })
    ).toBe(true);
    expect(mocks.stripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("reuses one PaymentIntent when card is selected twice", async () => {
    const draftId = crypto.randomUUID();
    const first = await sessionRequest(draftId);
    const second = await sessionRequest(draftId);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.clientSecret).toBe(second.body.clientSecret);
    expect(first.body.paymentIntentId).toBe(second.body.paymentIntentId);
    expect(mocks.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
    expect(mocks.stripe.paymentIntents.retrieve).toHaveBeenCalledTimes(1);
  });

  it("updates the existing PaymentIntent when the total changes", async () => {
    const draftId = crypto.randomUUID();
    await sessionRequest(draftId);
    const changed = await sessionRequest(draftId, { duration: 3 });

    expect(changed.status).toBe(200);
    expect(mocks.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
    expect(mocks.stripe.paymentIntents.update).toHaveBeenCalledWith(
      "pi_1",
      expect.objectContaining({ amount: 9000 })
    );
    expect(changed.body.amount).toBe(90);
  });

  it("cancels the PaymentIntent and abandons the draft when switching away", async () => {
    const draftId = crypto.randomUUID();
    await sessionRequest(draftId);

    const cancelled = await cancelRequest(draftId);

    expect(cancelled.status).toBe(200);
    expect(cancelled.body.cancelled).toBe(true);
    expect(mocks.stripe.paymentIntents.cancel).toHaveBeenCalledWith("pi_1");
    const pending = await PendingBooking.findOne({ draftId }).lean();
    expect(pending?.status).toBe("abandoned");
  });
});

describe("offline cash booking", () => {
  it("creates one booking when the same draft is submitted twice", async () => {
    const draftId = crypto.randomUUID();
    const cash = {
      ...BODY,
      selectedVehicle: vehicleId,
      paymentMethod: "cash",
      whatsappOptIn: false,
      locale: "en",
    } as CashBookingInput;

    const first = await createCashBooking(cash, undefined, draftId);
    const second = await createCashBooking(cash, undefined, draftId);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.tripId).toBe(first.tripId);
    expect(await Booking.countDocuments({ draftId })).toBe(1);
  });

  it("dedupes two booking POSTs sharing an Idempotency-Key header", async () => {
    const draftId = crypto.randomUUID();
    const call = () =>
      createBookingRoute(
        new NextRequest("http://localhost/api/booking", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Idempotency-Key": draftId,
          },
          body: JSON.stringify({
            ...BODY,
            selectedVehicle: vehicleId,
            paymentMethod: "cash",
            whatsappOptIn: false,
            locale: "en",
          }),
        })
      );

    const first = await call();
    const second = await call();
    const [firstBody, secondBody] = await Promise.all([
      first.json(),
      second.json(),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(secondBody.tripId).toBe(firstBody.tripId);
    expect(await Booking.countDocuments({ draftId })).toBe(1);
  });
});

describe("webhook finalize idempotency", () => {
  it("creates one booking when the same draft is finalized twice", async () => {
    process.env.QA_MOCK_EMAIL = "1";
    process.env.QA_MOCK_WHATSAPP = "1";
    try {
      const draftId = crypto.randomUUID();
      const orderId = "ord_webhook_1";
      const paymentIntentId = "pi_paid_1";
      await PendingBooking.create({
        orderId,
        draftId,
        bookingData: {
          ...BODY,
          selectedVehicle: vehicleId,
          locale: "en",
          totalAmount: 60,
          subtotalAmount: 60,
          taxAmount: 0,
          taxPercentage: 0,
        },
        paymentMethod: "stripe",
        stripePaymentIntentId: paymentIntentId,
        status: "open",
        expectedAmount: 60,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      await Setting.updateOne(
        {},
        { $set: { stripeSecretKey: "sk_test", stripeWebhookSecret: "whsec_test" } }
      );

      mocks.stripe.paymentIntents.retrieve.mockResolvedValue({
        ...paymentIntent(6000, "succeeded"),
        id: paymentIntentId,
        amount_received: 6000,
        metadata: { order_id: orderId, draft_id: draftId },
      });

      // The webhook route only signs/parses the event; verification of the
      // PaymentIntent itself goes through the mocked stripe client.
      const payload = JSON.stringify({
        id: "evt_paid_1",
        object: "event",
        type: "payment_intent.succeeded",
        data: { object: { id: paymentIntentId, object: "payment_intent" } },
      });
      const signature = new Stripe("sk_test").webhooks.generateTestHeaderString({
        payload,
        secret: "whsec_test",
      });
      const callWebhook = () =>
        stripeWebhook(
          new NextRequest("http://localhost/api/stripe-webhook", {
            method: "POST",
            headers: { "stripe-signature": signature },
            body: payload,
          })
        );

      const first = await callWebhook();
      const second = await callWebhook();

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(await Booking.countDocuments({ draftId })).toBe(1);
      expect(await PendingBooking.countDocuments({ draftId })).toBe(0);
      const booking = await Booking.findOne({ draftId }).lean();
      expect(booking?.tripId).toBe(orderId);
      expect(booking?.paymentStatus).toBe("completed");
    } finally {
      delete process.env.QA_MOCK_EMAIL;
      delete process.env.QA_MOCK_WHATSAPP;
    }
  });
});

describe("thank-you payment status by draft", () => {
  it("returns the finalized booking for a draft id", async () => {
    const draftId = crypto.randomUUID();
    await Booking.create({
      tripId: "trip_draft_paid",
      draftId,
      pickup: "Airport",
      dropoff: "Hotel",
      tripType: "oneway",
      date: "2026-12-01",
      time: "10:00",
      passengers: 2,
      selectedVehicle: vehicleId,
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+14155552671",
      paymentMethod: "stripe",
      paymentStatus: "completed",
      status: "upcoming",
      totalAmount: 75,
    });

    const response = await paymentStatus(
      new NextRequest(`http://localhost/api/payment-status?draftId=${draftId}`)
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.finalized).toBe(true);
    expect(body.tripId).toBe("trip_draft_paid");
    expect(body.amount).toBe(75);
    expect(body.paymentMethod).toBe("stripe");
  });

  it("reports an open draft as processing", async () => {
    const draftId = crypto.randomUUID();
    await PendingBooking.create({
      orderId: "ord_pending",
      draftId,
      bookingData: {
        ...BODY,
        selectedVehicle: vehicleId,
        locale: "en",
        totalAmount: 50,
      },
      paymentMethod: "stripe",
      status: "open",
      expectedAmount: 50,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const response = await paymentStatus(
      new NextRequest(`http://localhost/api/payment-status?draftId=${draftId}`)
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.found).toBe(true);
    expect(body.finalized).toBe(false);
    expect(body.processing).toBe(true);
    expect(body.tripId).toBe("ord_pending");
  });
});

---
name: booking-payments
description: Stripe PaymentIntents, MultiSafepay, cash, pending bookings, webhooks, and finalize-paid-booking. Use when changing checkout, payment intents, webhooks, invoices, or marking a ride paid.
---

# Booking payments

Read Stripe / MultiSafepay docs via Context7 before changing provider calls.

## Rule

**Provider says paid → then `finalizePaidBooking`.** Never set `paymentStatus: "completed"` from the browser or from a client-sent amount.

Canonical path: `src/features/payments/lib/finalize-paid-booking.ts`.

Thin wrappers (keep them thin):

- `src/app/api/create-payment-intent/route.ts` — Stripe
- `src/app/api/create-multisafepay-order/route.ts`
- `src/app/api/stripe-webhook/route.ts`
- `src/app/api/multisafepay-webhook/route.ts`
- `src/app/api/complete-payment/route.ts` — return URL / client confirm
- `src/features/payments/lib/stripe-client.ts`
- `src/features/payments/lib/multisafepay-api.ts`

## Flow

1. Create/update `PendingBooking` with `orderId`, passenger, trip, **server-computed** totals.
2. Create Stripe PaymentIntent or MultiSafepay order for that total (Stripe: integer **cents**).
3. Webhook or success page calls `finalizePaidBooking({ provider, paymentIntentId | transactionId | orderId })`.
4. Verify with the provider. Compare paid amount to pending total.
5. Insert `Booking` with `tripId`, `paymentStatus: "completed"`. Delete pending. Send mail (`send-booking-emails.ts`). Notify partners if unassigned.

Cash: booking may be created without a provider capture — still recompute fare; do not skip validation.

## Money

- App documents: major units, 2 decimals (`calculateBookingPrice` / `roundMoney`).
- Stripe API: cents. Convert only at `stripe-client`.
- Tax: Settings `enableTax` / `taxPercentage` / `taxIncluded`. Don't double-tax in the UI and the server.

## Do not

- Trust `formData.totalAmount` from the client as the charge
- Duplicate finalize logic in a webhook
- Log secret keys, full PANs, or raw webhook bodies that contain PII beyond what already exists
- Mark paid if PaymentIntent status is not `succeeded` (or MSP equivalent paid/completed)

If you must change finalize, split helpers out rather than growing that file past 200 lines.

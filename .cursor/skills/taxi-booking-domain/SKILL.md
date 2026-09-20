---
name: taxi-booking-domain
description: Taxi/chauffeur booking domain — 3-step wizard, vehicles, fares, ride assignment, partners, drivers. Use when changing bookings, trips, fleet, form-builder, dispatch, or partner accept/reject flows.
---

# Taxi booking domain

One operator. Customers book; admins dispatch; drivers execute; partners take overflow. Not a marketplace of many brands.

## Public wizard (3 steps)

1. **Trip** — `src/components/form/steps/Step1TripDetails.tsx` + `src/hooks/form/form-steps/useStep1.ts`  
   Booking type: `destination` | `hourly`. Trip: `oneway` | `roundtrip`. Pickup, dropoff, stops, date/time, passengers, duration (hourly).
2. **Vehicle** — Step2 + fleet from `Vehicle` model (active only). Show computed price.
3. **Pay + passenger** — Step3. Stripe / MultiSafepay / cash. Contact fields.

Embeddable variants: `src/app/[locale]/embeddable/v1|v2|v3` and `custom/[id]`. Form layouts live in `FormLayout` (admin form-builder).

Do not add a fourth step without updating step indicator copy in all locales.

## Fare (always server)

Use `calculateBookingPrice` in `src/lib/payments/calculate-booking-total.ts`.

- Destination: `base + (pricePerKm × distanceKm)`, then `minimumFare`, then round-trip `returnPricePercentage`.
- Hourly: `pricePerHour × max(duration, minimumHours)`.
- Add child/baby seats and stop fees. Then tax from Settings (`enableTax`, `taxPercentage`, `taxIncluded`).
- Distance from `/api/distance` (Google Distance Matrix). If distance fails, do not silently invent a cheaper fare — follow existing fallback in that service.

Never persist a client-sent `totalAmount` as the charged amount.

## Documents

| Model | Role |
|---|---|
| `PendingBooking` | Checkout in progress (`orderId`). Deleted after successful finalize |
| `Booking` | Confirmed trip (`tripId`). `paymentStatus` vs ride `status` are different |
| `Vehicle` | Rates + capacity |
| `Driver` / `Partner` / `User` | Portals; User is admin only |
| `Setting` | SMTP, Stripe, MultiSafepay, maps, tax, site copy |
| `FormLayout` | Custom step-1 field order/styles |

Ride `status`: `upcoming` | `completed` | `canceled`.  
Payment `paymentStatus`: `pending` | `completed` | `failed` | `refunded`.

## Dispatch

- Admin assigns `assignedDriver` or `assignedPartner` and emails (`RideAssignment`).
- Unassigned paid rides may be offered to eligible partners (`notify-eligible-partners`, `availableForPartners`).
- Partner accept: `src/app/api/partners/rides/[id]/accept/` — check still available, then IDOR/role.
- Drivers see **their** assigned rides only.

## When adding a field

1. Mongoose schema + TypeScript document type.
2. Zod input schema if it crosses HTTP.
3. Wizard UI + hook.
4. Price function if it affects money.
5. Email/PDF if customers see it.
6. All 8 `messages/*.json` files.

Do not add cleaning-job concepts, live GPS tracking, or a second company department unless asked.

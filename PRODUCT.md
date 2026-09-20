# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One operator runs a taxi / chauffeur / private-transfer business. Customers, drivers, affiliate partners, and office staff are co-equal audiences — do not treat any role as secondary product truth.

- **Customers** (private and business): book a transfer in the public 3-step wizard (or an embeddable form), pay online or cash, receive confirmation and a VAT-style invoice PDF.
- **Drivers**: sign in to a simplified portal, see assigned upcoming trips, open navigation.
- **Partners** (affiliate transport companies): register, upload compliance documents, request fleet categories, accept farmed-out rides, track earnings and billing.
- **Admin staff** (dashboard): manage rides (assign driver/partner, cancel), fleet and pricing, form layouts, SMTP/payments/maps settings, partner approval and payouts.

## Product Purpose

This app is the booking and dispatch engine for that operator: a customer can request a ride, a fare is calculated, payment is collected, staff can assign it, and the parties get email. Success is a completed, paid, assigned trip without a second tool.

## Positioning

Neighbors sell a generic contact form or a full Uber-style marketplace. This product is **one company's** booking site plus back office: scheduled and point-to-point transfers, hourly hire, embeddable forms, and optional partner overflow. It is not a multi-tenant SaaS for other operators unless that is explicitly requested later.

## Operating Context

Surfaces (all in product scope):

- Public booking wizard — `/[locale]` and embeddable routes `/[locale]/embeddable/*`
- Payment result pages — `payment-success`, `payment-cancelled`, `thank-you`
- Admin dashboard — `/[locale]/dashboard/*`
- Driver portal — `/[locale]/drivers/*`
- Partner portal — `/[locale]/partners/*`
- APIs under `/api/*` (bookings, payments, webhooks, admin, cron)

Dev: `npm run dev` → `http://localhost:3000`. Default locale `en`; also `fr` `es` `de` `nl` `it` `ru` `ar` (RTL).

Money and maps are operator-configured (currency, tax, Stripe, MultiSafepay, Google Maps country/bounds). Env example uses a Swiss-style placeholder brand — **do not treat that as a locked trading name**.

## Capabilities and Constraints

Confirmed in the repo:

- Booking types: destination transfer (one-way / round-trip) and hourly. Optional stops, child/baby seats, flight number, notes.
- Pricing: vehicle base + per-km (Distance Matrix) or per-hour, minimum fare/hours, return percentage, stop fees, tax. Always recomputed on the server.
- Payments: Stripe cards, MultiSafepay (iDEAL and similar), cash. Pending bookings convert to bookings only after verified payment (or cash confirm).
- Roles: `admin` / `superadmin`, `driver`, `partner`. NextAuth credentials + JWT.
- Fleet: vehicles with capacities and rate fields. Partners request access to vehicle categories.
- Form builder: admin-designed step-1 layouts and styles; presets `v1` `v2` `v3` plus custom layouts.
- Mail: confirmation, admin notify, assignment, cancellation, partner notify, password OTP. PDF invoices via `@react-pdf/renderer`.
- i18n dictionaries in `messages/*.json`. UI must not show raw API/Zod English.
- Destructive actions require confirm. Loading copy ends with `…`.

Undecided / do not invent:

- Locked public trading name, final logo, or legal entity (env/settings placeholders only).
- Native mobile apps — this product is web-only.
- Multi-tenant SaaS for other operators.
- WCAG target level beyond the known needs below.
- Migrating off Next.js, MongoDB, or NextAuth.

## Brand Commitments

- Working product name in the repo: **TaxiBooking-Form** / settings `websiteName`. Do not fabricate a customer-facing legal name.
- Voice: active, specific actions (“Continue”, not “Submit”). Errors say how to fix.
- Admin and driver/partner screens are **tools**. Scanability beats decoration. The public wizard is a conversion surface — clear steps, visible price, trustworthy payment.
- Client branding (logo, colors) is configured in Appearance / form-builder settings. Do not invent a new brand system unless asked.

## Evidence on Hand

- In-product copy: `messages/*.json`
- README capability list (engineering overview, not marketing proof)
- No testimonials, case studies, or “used by” claims. Do not invent customers, benchmarks, or ratings.

## Product Principles

1. **One operator.** Shared fleet and staff; partners are affiliates of this company, not a marketplace of many brands.
2. **Every role is first-class.** Customer checkout, driver schedule, partner accept, and admin dispatch must all stay correct.
3. **Never trust the client for money.** Recompute fares and verify payment provider status server-side.
4. **Operate surfaces are tools.** Dashboard/driver/partner UI exists to finish the job, not to decorate.
5. **Do not fabricate.** Trading names, logos, testimonials, and metrics stay absent until they exist in settings or assets.

## Accessibility & Inclusion

- Hit targets at least 44px on mobile. Icon-only controls have a name.
- Honor `prefers-reduced-motion`.
- `ar` is RTL; layout and icons must not assume LTR.
- Copy in all eight locales when adding user-facing strings. Money and dates via `Intl` using the active locale.

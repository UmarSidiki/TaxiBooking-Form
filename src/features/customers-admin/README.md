# Customers admin

Admin-only customer list, profile, notes, audit, and CSV export (spec milestones C1–C5).

## Scope

This deployment is **single-tenant**: one operator owns every booking. Nothing
here filters by a tenant id because the database itself belongs to the
deployment. If white-label multi-tenant hosting is ever added, every query in
`customer-stats.repo.ts` must gain the same tenant key as `Booking`.

## CustomerStats (C1)

`model/CustomerStats.ts` is a materialised read model, one row per lowercased
email. The admin list reads it instead of aggregating bookings per request.

- `lib/customer-stats/aggregate-customer-stats.ts` — pure reducer over booking
  projections. No DB access, no regex.
- `lib/customer-stats/refresh-customer-stats.ts` — recompute one customer from
  their bookings. Idempotent, so create / patch / complete / cancel all call it
  instead of tracking deltas.
- `lib/customer-stats/rebuild-customer-stats.ts` — key-set paged full rebuild
  plus stale-row pruning. Runs once per UTC day from `runDaily()` in
  `/api/cron`, and from `scripts/backfill-customer-stats.ts`.
- `scripts/backfill-customer-stats.ts` — dry-run by default; refuses any
  `MONGODB_URI` that is not a plain local `mongodb://` URI.

Semantics: `rideCount` counts confirmed rides (`upcoming` + `completed`),
`completedCount` counts `completed`, and `totalSpendMinor` sums captured money
(minor units, refunds deducted). `firstRideAt` / `lastRideAt` use completed
rides; `hasUpcoming` tracks `upcoming`.

## Customers list (C2)

- `GET /api/admin/customers` — `requireAdmin()` (admin/superadmin only; other
  roles get 403). Query schema: `schema/customer-list.schema.ts`.
- Search matches **prefixes only** on indexed `emailLower`, `nameLower` and
  `phoneDigits` using range queries (`$gte` / `$lt`). There is no substring
  matching and no regex anywhere in this feature.
- Filters: rides range, spend range (major units in the API), last ride
  (within/before N days or never), verified WhatsApp, email/WhatsApp consent,
  locale, has upcoming ride. Sort: name, email, rides, spend, last ride,
  created.
- Pagination is cursor-based, 50 rows per page, with `emailLower` as the
  stable tie-break. The base64 cursor is bound to the sort field + direction;
  a malformed or mismatched cursor returns `400 invalid_cursor`.
- `nameLower` is written by `writeCustomerStatsRows`. Rows created before C2
  stay searchable by email/phone until the next nightly rebuild; run
  `npm run stats:backfill` to populate names immediately.
- Consent columns default to `none` on purpose: past customers are **not**
  consented (opt-in only). C6 will maintain the `MarketingConsent` event log
  and update these caches; never infer consent from `Booking.whatsappOptIn`.
- The dashboard page `/dashboard/customers` renders a desktop table, mobile
  cards, and a filter drawer. All list strings live in `Dashboard.Customers`
  and `Sidebar.customers` across the 8 locales.

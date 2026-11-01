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

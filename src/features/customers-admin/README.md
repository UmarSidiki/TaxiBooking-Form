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
- Customer names link to `/dashboard/customers/[id]`, where `id` is the
  lowercased email from `CustomerStats`.

## Customer profile (C3)

`GET /api/admin/customers/[id]` — admin-only. `id` is the lowercased email.
The payload (`lib/customer-profile/load-customer-profile.ts`) combines:

- header: `CustomerStats` (rides, spend, first/last ride, consent) with the
  `CustomerProfile` name, verified phone and locale as fallbacks.
- bookings: at most `PROFILE_BOOKINGS_LIMIT` (100) bookings matched by email
  with a case-insensitive collation. No regex, no unbounded query.
- payments: captured/refunded money from `Booking` plus `RideCharge` rows for
  the customer's trips. `RideCharge.amount` is major units and is converted to
  integer minor units in the payload.
- sessions: the customer's `CustomerSession` rows (latest 50, including
  revoked/expired) with device family, IP prefix and timestamps.
- whatsapp: `CustomerProfile.verifiedPhone`/`verifiedPhoneAt`, the cached
  `CustomerStats.whatsappConsent`, and the latest `WhatsAppSendLog` for the
  verified JID.

`DELETE /api/admin/customers/[id]/sessions` revokes every active session using
`revokeAllCustomerSessions`. `DELETE .../sessions/[sessionId]` revokes one row
through `revokeCustomerSessionById`; the helper matches `emailLower` too, so a
session that belongs to another customer returns 404 and stays active.

Consent is never inferred from the legacy `Booking.whatsappOptIn` flag: the
header and WhatsApp tab read the `CustomerStats` consent cache, which defaults
to `none` (opt-in only). Marketing, notes and activity tabs are placeholders
until C4/C6.

`verifiedPhoneAt` was added to `CustomerProfile` for this milestone. It is
written when a phone verification completes and cleared when the phone is
removed; older profiles show "never" until they verify again.

The profile page lives in `ui/customer-profile-*.tsx` and strings in
`Dashboard.CustomerProfile` across the 8 locales. The whole feature remains
single-tenant: email is the only scoping key because the deployment owns all
data.

## Admin notes and audit log (C4)

- `model/AdminNote.ts` — soft-deleted notes keyed by `emailLower`. Text is
  capped at 2,000 characters, stored verbatim and rendered as a React text
  node (`ui/admin-note-text.tsx`), so pasted HTML stays inert. Only the note
  author may edit or delete it; other admins get `403`.
- `model/AdminAuditLog.ts` — append-only, TTL index expires rows after two
  years (63,072,000 s). It records actor id/email/name/role, action, target,
  safe metadata (counts and ids only), IP prefix and time. Metadata never
  contains note bodies, OTP codes or message content.
- `lib/audit/record-admin-audit.ts` — the single write helper. Notes
  (`customer.note.create|update|delete`), the C3 session revokes
  (`customer.sessions.revoke|revoke_all`) and future exports/campaign actions
  all call it.
- `GET/POST /api/admin/customers/[id]/notes` and
  `PATCH/DELETE /api/admin/customers/[id]/notes/[noteId]` — admin-only. The
  list response includes a server-computed `canEdit` flag so the client never
  needs the viewer id.
- `GET /api/admin/customers/[id]/activity` — the profile **Activity** tab,
  newest first, capped at 50 entries.
- `GET /api/admin/audit` and `/dashboard/customers/audit` — filter by action,
  actor email prefix, target id and date range. Cursor pagination (50/page,
  max 100) sorts by `at` then `_id`; malformed cursors return
  `400 invalid_cursor`. The audit page is linked from the Dispatch nav group.

Every API route uses `requireAdmin()` (admin/superadmin only; other roles get
`403`). The audit list uses index ranges for actor prefixes and never a regex
scan.

## CSV export (C5)

- `GET /api/admin/customers/export` — admin/superadmin only (`403` for every
  other role). It accepts the C2 list filters and sort, but no cursor: the
  export always starts at the first row. The dashboard toolbar's **Export CSV**
  link passes the filters currently on screen and lets the browser stream the
  download.
- `lib/customer-export/customer-export-rows.ts` — key-set pages the same
  `CustomerStats` filter as the list in batches of 500 and stops at
  `CUSTOMER_EXPORT_MAX_ROWS` (50,000). No regex, no skip, no unbounded query.
- `lib/customer-export/customer-export-row.ts` — columns are the list columns
  plus consent: name, email, phone, phone verification, rides, completed rides,
  total spend (major units), currency, first/last ride, upcoming, locale,
  email/WhatsApp consent, created.
- `lib/customer-export/csv-cell.ts` — RFC 4180 quoting and formula-injection
  guard: a cell starting with `=` `+` `-` `@` (or tab/CR) gets a leading `'`, so
  Excel never executes `=cmd`.
- `lib/customer-export/stream-customer-export.ts` — `ReadableStream` response
  starting with a UTF-8 BOM (Excel), chunked rows, and `csv.export` audit
  metadata (`rowCount`, compact filter JSON). The audit is written from the
  stream finaliser, so an aborted download is still recorded.
- Single-tenant: the export reads every `CustomerStats` row because the
  deployment owns all customer data; there is no tenant id to add here.
# Marketing

Consent, unsubscribe, suppression, segments, templates and staff test sends
(spec C6–C7 + §2.6). Campaign delivery itself lands in C8+.

## Scope

Single-tenant deployment: email is the only customer key. There is no tenant id
because the database belongs to one operator.

## Models

- `model/MarketingConsent.ts` — append-only events
  `{emailLower, channel, status, source, textVersion, ipPrefix, reason, actorId, at}`.
  Never edited; the cache below is derived from the latest event.
- `model/Suppression.ts` — `{channel, key, reason, at}` with a unique
  `(channel, key)`. `key` is `emailLower` for email and phone digits for
  WhatsApp. Suppression always overrides consent.

## Cache and eligibility

`applyMarketingConsent()` writes the event, updates
`CustomerProfile.marketing.<channel>` and `CustomerStats.<channel>Consent`, then
maintains suppression: withdrawal suppresses the channel; re-granting only
clears `unsubscribed` / `stop`, never `bounced` or `complaint`.

`checkMarketingEligibility()` is the single send gate. It requires
`status === "granted"`, no suppression row, and — for WhatsApp — a verified
phone number. `recordCheckoutMarketingConsent()` only ever writes grants; an
unticked checkout box writes nothing, so past customers stay unconsented.

## Unsubscribe

`signUnsubscribeToken()` reuses the existing purpose-bound HMAC signer with
purpose `unsubscribe` and encodes `{email, channel}`. `readUnsubscribeToken()`
rejects tokens from every other purpose. The public page
`/[locale]/u/[token]` performs the withdrawal on GET (one click, no login) and
offers re-subscribe via `POST /api/marketing/unsubscribe` (also the
`List-Unsubscribe-Post: One-Click` target).

## Mail

`sendMarketingEmail()` uses `Settings → Marketing` (`marketingSenderName`,
`marketingSenderEmail`, `marketingReplyTo`) and falls back to the transactional
SMTP sender. Every message gets `List-Unsubscribe` and
`List-Unsubscribe-Post: One-Click` headers pointing at the signed API URL.

Owner decisions encoded here: WhatsApp marketing cap `100/day`, quiet hours
`20:00–09:00` operator-local, open/click tracking off by default
(`lib/marketing.constants.ts`).

## Segments and templates (C7)

- `model/Segment.ts` — `{name, filter, createdBy}`. `filter` is the validated C2
  customer-list filter (`schema/segment.schema.ts`), minus pagination and sort.
  `parseSegmentFilter()` normalises it on read and clears the consent /
  verified-number fields: those belong to the campaign channel.
  `segmentFilterForChannel()` forces `emailConsent = granted` for email and
  `whatsappConsent = granted` plus `verifiedWhatsApp = yes` for WhatsApp, so a
  saved filter can never widen the audience.
- `lib/segments/count-segment.ts` — live `{total, eligible, excluded}` count
  over `CustomerStats`. The base total and eligible count run in parallel.
- `model/CampaignTemplate.ts` — per channel, per locale `{subject, preheader,
  body}`, derived `variables`, incrementing `version`.
  `schema/campaign-template.schema.ts` rejects email templates without
  `{{unsubscribeUrl}}` or a subject, WhatsApp templates without the
  `Reply STOP to unsubscribe` line, unknown `{{variables}}`, and locale maps
  without `en`.
- `lib/templates/render-template.ts` — pure renderer. The body is trusted HTML;
  every interpolated customer value is HTML-escaped. Locale falls back to `en`.
  Missing values are returned for the preview warning list.
- `lib/templates/preview-campaign-template.ts` — renders against a real
  `CustomerStats` row that passes the segment + channel gate, and signs a
  one-click unsubscribe URL for that customer. Nothing is stored or sent.
- `lib/test-send/send-test-message.ts` — renders a demo message and sends it
  only to an address or number on `Setting.marketingTestRecipients`
  (Settings → Marketing). Test sends never write campaign recipients and never
  count toward stats. WhatsApp test sends use the existing `sendWhatsAppTexts`
  path with kind `test` (QA mock honoured).
- APIs are admin/superadmin only (`403` otherwise), cursor-free and capped:
  `/api/admin/marketing/segments`, `.../segments/[id]`,
  `.../segments/[id]/count?channel=`, `.../templates`, `.../templates/[id]`,
  `.../templates/[id]/preview`, `.../templates/[id]/test-send`.
- Desk UI: `/dashboard/marketing` (sidebar → Dispatch → Marketing) with segment
  creation from the C2 filter fields, live counts, template editor, preview
  (isolated iframe) and test send. Copy lives in `MarketingDesk` and
  `MarketingSettings` in all 8 locales.
- Settings → Marketing now stores the staff allowlist, WhatsApp daily cap,
  quiet hours and the two tracking toggles (both default off). The defaults
  come from `lib/marketing.constants.ts`; the send-time gates stay in C8/C9.

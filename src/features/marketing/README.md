# Marketing

Consent, unsubscribe, suppression and the marketing mailer (spec C6 + §5).
Campaigns themselves land in later milestones.

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

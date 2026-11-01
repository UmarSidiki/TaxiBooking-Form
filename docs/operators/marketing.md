# Marketing campaigns (operators)

## Consent

- Marketing is **opt-in only**. A customer receives marketing only after explicitly granting consent for the relevant channel (email and/or WhatsApp).
- **Past customers are not consented.** Historical bookings do not imply marketing consent; only an explicit opt-in counts.

## WhatsApp

- WhatsApp marketing is capped at **100 messages per day** (configurable via the marketing WhatsApp daily cap setting).

## Quiet hours

- Marketing sends respect quiet hours of **20:00–09:00** (recipient local time). Messages scheduled inside this window are deferred.

## Cron

- Schedule the cron endpoint every **5 minutes** using cron-job.org (or equivalent), passing `CRON_SECRET` as `?secret=` (or `Authorization: Bearer`).

## Sender

- Use a **separate marketing sender** setting (marketing sender name/email and reply-to) distinct from transactional SMTP.

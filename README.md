# Taxi booking form

Web app for one taxi / chauffeur operator: public 3-step booking wizard (and embeddable forms), admin dispatch dashboard, driver portal, and partner portal.

Not a multi-operator marketplace. Product rules: [PRODUCT.md](./PRODUCT.md). Visual tokens: [DESIGN.md](./DESIGN.md). Folder map: [ARCHITECTURE.md](./ARCHITECTURE.md). Agent rules: [AGENTS.md](./AGENTS.md).

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 · shadcn/ui (New York)
- MongoDB · Mongoose 9
- NextAuth.js v4 (JWT)
- next-intl (en, fr, es, de, nl, it, ru, ar)
- Stripe PaymentIntents · MultiSafepay · cash
- Google Maps (Places, Distance Matrix, JS API)
- Nodemailer (SMTP from Settings in MongoDB)

## Install

Prerequisites: Node.js 20+, a MongoDB instance, a Google Maps API key (Places, Maps JavaScript, Distance Matrix).

```bash
npm install
cp .env.example .env.local
```

Required in `.env.local`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `NEXTAUTH_SECRET` | NextAuth JWT secret |
| `NEXTAUTH_URL` | App origin (local: `http://localhost:3000`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps / Places / Distance Matrix |
| `CRON_SECRET` | Shared secret for `/api/cron`. Required before the job will run. |

Stripe, MultiSafepay, and SMTP are configured in the **admin Settings** UI (MongoDB), not only in env. See `.env.example` for optional public site copy (`NEXT_PUBLIC_WEBSITE_NAME`, support phone/email).

Never commit `.env.local` or real secrets.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default locale is `en` (`/en`, …). Admin: `/en/dashboard`. Drivers: `/en/drivers`. Partners: `/en/partners`.

## Build

```bash
npm run build
npm start
```

`npm run build` runs `scripts/sync-build-settings.mjs` first (writes non-secret settings from Mongo into `src/shared/config/baked-settings.json` when `MONGODB_URI` is set), then `next build`.

## Test

There is no automated test suite. Before merging:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Deploy

Any Node host that can run `npm run build` and `npm start` (or a Next.js platform such as Vercel).

1. Set the same env vars as `.env.example` on the host (`MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` must match the public URL).
2. Configure Stripe / MultiSafepay webhook URLs to `/api/stripe-webhook` and `/api/multisafepay-webhook`.
3. Schedule `/api/cron` (see below). Vercel’s free plan only allows the daily trigger in `vercel.json`.
4. After first deploy, sign in as admin and fill Settings (SMTP, payment keys, maps bounds, tax).

## Hourly cron (cron-job.org)

`/api/cron` is not behind the locale middleware. Call that path, not `/en/api/cron`.

The route accepts **GET and POST**. It fails closed when `CRON_SECRET` is empty. Send the secret in one of these ways (constant-time compare):

- `Authorization: Bearer <CRON_SECRET>` (this is what Vercel Cron sends)
- `x-cron-secret: <CRON_SECRET>`
- `?key=<CRON_SECRET>` (works, but the secret can land in access logs; prefer a header)

On [cron-job.org](https://cron-job.org):

1. Create a job. URL: `https://<your-domain>/api/cron`. Schedule: every hour.
2. Method: GET (or POST).
3. Add a header `x-cron-secret` with the same value as `CRON_SECRET`.
4. Save. A success response is small JSON: `{ "ok": true, "hourly": { "reminders": 0, "notifications": 0 }, "daily": "skipped" }`.

Reminders and thank-you mail run on every call and are idempotent. Cleanup, old-ride deletion, and later daily work (document expiry, recurring rides) run at most once per UTC day. A second overlapping call returns `{ "ok": true, "skipped": "locked" }` and does not send again.

Leave the Vercel cron on its daily schedule. It uses the same route and the same secret, so it will not double-send.

## Layout (short)

```
src/app/           Next.js routes (do not relocate page.tsx / route.ts)
src/features/      Domain modules (booking, payments, fleet, rides, …)
src/shared/        UI primitives, DB, i18n, tokens — never imports features
messages/          next-intl dictionaries
```

Import with `@/features/…` and `@/shared/…`. Details in [ARCHITECTURE.md](./ARCHITECTURE.md).

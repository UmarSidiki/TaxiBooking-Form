# Taxi Booking Form — Agent Rules

This is a **taxi / chauffeur booking product**: public booking wizard, admin dashboard, driver portal, and partner portal in one Next.js app. It is **not** a multi-operator marketplace and **not** the Unified Services (taxi + cleaning) monorepo.

Product behavior lives in `PRODUCT.md`. Visual tokens live in `DESIGN.md` and `src/style/globals.css`. Read those when making product-facing or UI decisions.

## Stack (do not change unless asked)

- **App**: Next.js 16 App Router + React 19 + TypeScript strict
- **UI**: Tailwind CSS v4 (CSS-first) + shadcn/ui (New York) in `src/components/ui/`
- **DB**: MongoDB + Mongoose 9. Connect only via `connectDB()` from `@/lib/database`
- **Auth**: NextAuth.js v4 (`src/lib/auth/options.ts`). JWT sessions. Roles: `admin` | `superadmin` | `driver` | `partner`. Do not add a parallel auth stack.
- **i18n**: next-intl. Locales: `en` `fr` `es` `de` `nl` `it` `ru` `ar`. Default `en`. Dictionaries in `messages/{locale}.json`.
- **Payments**: Stripe PaymentIntents + MultiSafepay + cash. Finalize paid bookings through `src/lib/payments/finalize-paid-booking.ts`.
- **Maps**: Google Maps (Places, Distance Matrix, JS API)
- **Mail**: Nodemailer (`src/controllers/email/`, `src/lib/email.ts`). SMTP from settings in MongoDB, not hardcoded.
- **Validation**: Zod 4. Existing helper validators in `src/lib/validation.ts` stay until replaced by schemas.
- Versions matter: Zod 4, Tailwind v4, Next 16, Mongoose 9, Stripe SDK 20, next-intl 4. Check installed APIs before coding from memory.

## Commands

Package manager is **npm**.

```sh
npm run dev      # next dev
npm run lint     # eslint
npm run build    # sync baked settings + next build
```

### Verification

After UI or API changes:

```sh
npm run lint
```

After payments, auth, schema, or routing changes, also `npm run build` when feasible. There is no test suite — do not invent one unless asked.

## Env gotchas

- Copy `.env.example` → `.env.local`. Required: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- Maps key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Stripe / MultiSafepay / SMTP live primarily in the **Settings** document in MongoDB (admin UI), not only in env. Do not assume `.env` holds payment secrets.
- Never commit secrets. Never log passwords, OTP codes, or raw card data.

## File size (hard rule)

- One concern per file. Target **under 150 lines**. Split before **200**.
- Never grow a god file (HTTP + pricing + DB + email + UI in one place).
- New feature = new small files in the right folder. When you must edit a file already over 200 lines, extract the piece you touched into a sibling file.

```
# BAD
src/app/api/booking/route.ts          # validate + price + save + email + partners

# GOOD
src/app/api/booking/route.ts          # HTTP only: parse, call service, return JSON
src/lib/bookings/create-booking.service.ts
src/lib/bookings/booking.repo.ts
src/lib/schemas/booking.schema.ts
```

Route handlers never embed pricing, webhook verification, or mail sending. Those belong in `src/lib/<domain>/`.

## Layout (keep this shape)

```
src/
  app/
    [locale]/                 # pages only — thin
      (pages)/dashboard/      # admin
      (pages)/drivers/        # driver portal
      (pages)/partners/       # partner portal
      embeddable/             # embeddable booking forms
    api/                      # Route handlers — HTTP + status codes only
  components/
    ui/                       # shadcn primitives — wrap, don't fork
    form/                     # public 3-step booking wizard
    payment/ settings/ form-builder/
  hooks/                      # data + step logic, not inside JSX
  lib/
    auth/ database/ payments/ partners/ schemas/
    <domain>/                 # *.service.ts (rules) + *.repo.ts (queries)
  models/<domain>/            # Mongoose schemas + document types
  controllers/email/          # email templates (keep until migrated)
  i18n/                       # next-intl routing + request config
messages/                     # next-intl dictionaries (repo root)
```

### New code goes here

| Kind | Where |
|---|---|
| Page / layout | `src/app/[locale]/…` — compose only |
| API route | `src/app/api/<domain>/…/route.ts` |
| Business rules | `src/lib/<domain>/<feature>.service.ts` |
| Mongo queries | `src/lib/<domain>/<feature>.repo.ts` or existing model statics |
| Zod I/O | `src/lib/schemas/<feature>.schema.ts` |
| Mongoose schema | `src/models/<domain>/` |
| UI | `src/components/<feature>/` |
| Copy | `messages/*.json` (all 8 locales together) |

Do not add `backend/`, Expo apps, Drizzle, Hono, or Better Auth. This repo is one Next.js deployment.

## Behavior

- Stay on the requested task. Do not "improve" unrelated files. Match existing names and imports.
- TypeScript strict. No `any` without a justified one-liner. API/form types come from Zod (`z.infer`). DB document types come from Mongoose models.
- List endpoints: paginate or cap results. Never unbounded `Model.find()` on bookings.
- Independent I/O: `Promise.all`. Don't await in a loop.
- Money: major currency units (e.g. `49.90`), round to 2 decimals (`calculateBookingPrice`). **Recompute fares server-side** — never trust client totals. Stripe amounts in **cents** at the Stripe boundary only.
- IDOR: load booking/driver/partner by id **and** check role/ownership. `getServerSession(authOptions)` then verify `session.user.role`.
- Destructive actions need a confirm step. Loading copy ends with `…`; empty/error states are real UI.
- User-facing strings go through next-intl. Never surface raw Zod/API English.

---

# Design (always apply)

Visual source of truth: `src/style/globals.css` (`@theme inline` + `:root` / `.dark`). Change brand/color/type/space/radius **there** — never restyle components one-by-one or hardcode hex/pixel values (except admin-configured form-builder styles persisted in Mongo).

```
# BAD
<div className="bg-[#1a1a1a] rounded-[14px]" />

# GOOD
<div className="bg-background rounded-lg text-foreground border-border p-4" />
```

Craft floor: visible `:focus-visible` ring; honor `prefers-reduced-motion` (opacity/transform only, no `transition: all`); hit targets ≥ 44px on mobile. `ar` is RTL — do not assume LTR layout.

# Zod (always apply)

Runtime types live in `src/lib/schemas/`. TS types are `z.infer<typeof schema>` — never declare a parallel interface/DTO next to a schema.

Parse at every boundary: request bodies, query params, form values, webhooks. Don't trust `await req.json()` as typed. Don't hand-write response types when a schema exists.

# Search before you implement (always apply)

For anything you'd otherwise invent — NextAuth, Stripe/webhooks, MultiSafepay, Google Maps, Mongoose 9, next-intl, Tailwind v4, shadcn — fetch docs first via Context7 MCP (`resolve-library-id` → `query-docs`), then vendor docs. If docs disagree with this repo's stack, **this repo wins**. Skip the search only for renames, local-pattern wiring, or logic fully visible here.

# Project skills

Read the matching skill before non-trivial work:

- `.cursor/skills/llm-maintainable-code/SKILL.md` — split files, naming, LLM-friendly structure
- `.cursor/skills/taxi-booking-domain/SKILL.md` — wizard, pricing, rides, partners, drivers
- `.cursor/skills/booking-payments/SKILL.md` — Stripe, MultiSafepay, pending → paid
- `.cursor/skills/next-intl-copy/SKILL.md` — 8-locale copy, no hardcoded strings

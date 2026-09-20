# Taxi Booking Form — Agent Rules

This is a **taxi / chauffeur booking product**: public booking wizard, admin dashboard, driver portal, and partner portal in one Next.js app. It is **not** a multi-operator marketplace and **not** the Unified Services (taxi + cleaning) monorepo.

Product behavior: `PRODUCT.md`. Visual tokens: `DESIGN.md` and `src/shared/style/globals.css`. Folder map and layer rules: `ARCHITECTURE.md`.

## Stack (do not change unless asked)

- **App**: Next.js 16 App Router + React 19 + TypeScript strict
- **UI**: Tailwind CSS v4 (CSS-first) + shadcn/ui (New York) in `src/shared/ui/`
- **DB**: MongoDB + Mongoose 9. Connect only via `connectDB()` from `@/shared/db`
- **Auth**: NextAuth.js v4 (`src/features/auth/lib/options.ts`). JWT sessions. Roles: `admin` | `superadmin` | `driver` | `partner`. Do not add a parallel auth stack.
- **i18n**: next-intl. Locales: `en` `fr` `es` `de` `nl` `it` `ru` `ar`. Default `en`. Dictionaries in `messages/{locale}.json`. Request config: `src/shared/i18n/request.ts`.
- **Payments**: Stripe PaymentIntents + MultiSafepay + cash. Finalize paid bookings through `src/features/payments/lib/finalize-paid-booking.ts`.
- **Maps**: Google Maps (Places, Distance Matrix, JS API) in `src/features/booking/lib/maps/`
- **Mail**: Nodemailer. Templates in `src/features/<domain>/email/`. SMTP helper: `src/features/settings/lib/email.ts` (settings in MongoDB, not hardcoded).
- **Validation**: Zod 4. Domain schemas in `src/features/<domain>/schema/`. Shared helpers in `src/shared/lib/validation.ts`.
- Versions matter: Zod 4, Tailwind v4, Next 16, Mongoose 9, Stripe SDK 20, next-intl 4. Check installed APIs before coding from memory.

## Commands

Package manager is **npm**.

```sh
npm run dev      # next dev
npm run lint     # eslint
npm run build    # sync baked settings + next build
npx tsc --noEmit # type-check (no test suite)
```

### Verification

After UI or API changes: `npm run lint` and `npx tsc --noEmit`.
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
src/features/booking/lib/create-cash-booking.service.ts
src/features/booking/lib/booking.repo.ts
src/features/booking/schema/cash-booking.schema.ts
```

Route handlers never embed pricing, webhook verification, or mail sending. Those belong in `src/features/<domain>/lib/`.

## Layout (keep this shape)

```
src/
  middleware.ts                 # next-intl (must stay here)
  app/                          # App Router only — thin pages + route.ts
    [locale]/                   # pages compose feature UI
      (pages)/dashboard/        # admin URLs
      (pages)/drivers/          # driver portal URLs
      (pages)/partners/         # partner portal URLs
      embeddable/               # embeddable form URLs
    api/                        # HTTP + status codes only
  features/<domain>/            # UI, hooks, lib, model, schema, email
  shared/                       # no imports from features/
    ui/ db/ i18n/ style/ lib/ http/ context/ hooks/ config/ chrome/
messages/                       # next-intl dictionaries (repo root)
```

Do not move `src/app/**/page.tsx`, `layout.tsx`, `route.ts`, or `src/middleware.ts`.

### When adding X, put it in Y

| If you are adding… | Put it in… |
|---|---|
| A URL or `route.ts` | `src/app/…` (thin; do not relocate existing routes) |
| Wizard / embeddable UI | `src/features/booking/ui/` |
| Wizard hooks | `src/features/booking/hooks/` |
| Booking services / repos | `src/features/booking/lib/` |
| Fare / pending → paid | `src/features/payments/lib/` |
| Stripe UI | `src/features/payments/ui/` |
| Vehicle CRUD | `src/features/fleet/` |
| Admin ride dispatch UI | `src/features/rides/ui/` |
| Partner portal / admin partners | `src/features/partners/` |
| Driver portal | `src/features/drivers/` |
| SMTP / theme / operator settings | `src/features/settings/` |
| Form-builder canvas | `src/features/form-builder/` |
| Admin home / admin sidebar | `src/features/dashboard/` |
| Review model | `src/features/reviews/` |
| shadcn primitive | `src/shared/ui/` |
| `connectDB` | `@/shared/db` |
| Copy | `messages/*.json` (all 8 locales together) |
| A test | `*.test.ts` next to the file under test |

Do not add `backend/`, Expo apps, Drizzle, Hono, or Better Auth. This repo is one Next.js deployment.

## Naming

- Folders: kebab-case
- React files: kebab-case (`step1-trip-details.tsx`), PascalCase exports
- Hooks: `useThing.ts` (existing dominant style)
- Models: PascalCase files (`Booking.ts`)
- Services: `verb-noun.ts` (`finalize-paid-booking.ts`)
- Imports: `@/features/…` and `@/shared/…` — no `../../../` across features
- Public server surface (auth only): `import { authOptions } from "@/features/auth"`
- Everything else: import the file (`@/features/payments/lib/finalize-paid-booking`). Do not add mega barrels.

## Layer rules

1. `app` → `features` and `shared`. Never the reverse.
2. `features` → `shared`. Never `shared` → `features`.
3. Features may import another feature’s lib / model / email via a deep path. Booking is the aggregate root (`payments` / `rides` / `partners` may import `booking/model`). Do not import mixed `@/features/<x>` barrels except `authOptions` from `@/features/auth`.
4. A module must not import its own feature `index.ts`.

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

Visual source of truth: `src/shared/style/globals.css` (`@theme inline` + `:root` / `.dark`). Change brand/color/type/space/radius **there** — never restyle components one-by-one or hardcode hex/pixel values (except admin-configured form-builder styles persisted in Mongo).

```
# BAD
<div className="bg-[#1a1a1a] rounded-[14px]" />

# GOOD
<div className="bg-background rounded-lg text-foreground border-border p-4" />
```

Craft floor: visible `:focus-visible` ring; honor `prefers-reduced-motion` (opacity/transform only, no `transition: all`); hit targets ≥ 44px on mobile. `ar` is RTL — do not assume LTR layout.

# Zod (always apply)

Runtime types live in `src/features/<domain>/schema/`. TS types are `z.infer<typeof schema>` — never declare a parallel interface/DTO next to a schema.

Parse at every boundary: request bodies, query params, form values, webhooks. Don't trust `await req.json()` as typed. Don't hand-write response types when a schema exists.

# Search before you implement (always apply)

For anything you'd otherwise invent — NextAuth, Stripe/webhooks, MultiSafepay, Google Maps, Mongoose 9, next-intl, Tailwind v4, shadcn — fetch docs first via Context7 MCP (`resolve-library-id` → `query-docs`), then vendor docs. If docs disagree with this repo's stack, **this repo wins**. Skip the search only for renames, local-pattern wiring, or logic fully visible here.

# Project skills

Read the matching skill before non-trivial work:

- `.cursor/skills/llm-maintainable-code/SKILL.md` — split files, naming, LLM-friendly structure
- `.cursor/skills/taxi-booking-domain/SKILL.md` — wizard, pricing, rides, partners, drivers
- `.cursor/skills/booking-payments/SKILL.md` — Stripe, MultiSafepay, pending → paid
- `.cursor/skills/next-intl-copy/SKILL.md` — 8-locale copy, no hardcoded strings

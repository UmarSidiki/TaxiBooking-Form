# Architecture

Taxi / chauffeur booking app: public 3-step wizard, admin dashboard, driver portal, partner portal. One Next.js deployment. **Next.js owns URLs** (`src/app/`). Domain code lives in `src/features/`. Shared infrastructure lives in `src/shared/`.

## Folder map

```
.
├── messages/                 # next-intl dictionaries (8 locales)
├── public/                   # static assets (must stay at repo root)
├── scripts/                  # build helpers (baked settings sync)
├── src/
│   ├── middleware.ts         # next-intl routing (must stay here)
│   ├── app/                  # App Router only — thin pages + route.ts
│   ├── features/             # domain modules (UI, hooks, lib, model)
│   └── shared/               # no feature imports
├── AGENTS.md                 # rules for coding agents
├── PRODUCT.md                # product behavior
└── DESIGN.md                 # visual tokens
```

### `src/app/` (do not relocate)

File-system routes. Pages compose feature UI. Route handlers parse HTTP, call a feature `*.service.ts` / `*.repo.ts`, return JSON. URLs stay `/[locale]/…` and `/api/…`.

### `src/features/<domain>/`

Typical internals (omit empty layers):

| Folder | What belongs here |
|---|---|
| `ui/` | React components (kebab-case files, PascalCase exports) |
| `hooks/` | Client data / step logic |
| `lib/` | Services, repos, jobs (no HTTP) |
| `model/` | Mongoose schema + document type |
| `schema/` | Zod I/O |
| `email/` | Nodemailer templates for this domain |
| `context/` | React context for this domain |
| `index.ts` | Optional **server** public surface only (never mix with `"use client"`) |

Features: `auth`, `booking`, `payments`, `fleet`, `rides`, `partners`, `drivers`, `settings`, `form-builder`, `dashboard`, `reviews`.

### `src/shared/`

Used by many features. **Must not import `src/features/`.**

| Folder | Purpose |
|---|---|
| `ui/` | shadcn primitives |
| `chrome/` | Language switcher |
| `db/` | `connectDB()`, native Mongo client |
| `http/` | Browser `apiGet` / `apiPost` helpers |
| `lib/` | `cn`, ids, base URL, validation, time |
| `i18n/` | next-intl routing + request config |
| `style/` | `globals.css` |
| `config/` | Build-time baked settings JSON |
| `context/` | Cross-cutting client context (currency) |
| `hooks/` | Generic hooks (`useMediaQuery`, `use-mobile`) |

## Layer rules

1. `app` → `features` and `shared`. Never the reverse.
2. `features` → `shared`. Never `shared` → `features`.
3. Features may import another feature’s **lib / model / email** via a deep path. Booking is the aggregate root: `payments`, `rides`, and `partners` may import `booking/model`. Do not import a mixed `@/features/<x>` barrel except `authOptions` from `@/features/auth`.
4. A module must not import its own feature `index.ts` (circular barrels).
5. Do not add a mega barrel that re-exports an entire feature.

## Data flow (booking)

```
Wizard / embeddable UI
  → /api/* route.ts (Zod parse)
    → feature service (recompute fare; never trust client totals)
      → repo / Mongoose model
    → payments.finalizePaidBooking (after provider verify)
    → email templates in the owning feature
```

Money stays in major units in the app. Stripe amounts are integer cents only at the Stripe boundary.

## Where to add new work

| If you are adding… | Put it in… |
|---|---|
| A URL or `route.ts` | `src/app/…` (thin) |
| Wizard step UI / hooks | `src/features/booking/ui` / `hooks` |
| Fare / pending → paid | `src/features/payments/lib` |
| Vehicle CRUD UI | `src/features/fleet/` |
| Admin ride dispatch UI | `src/features/rides/` |
| Partner portal / admin partners | `src/features/partners/` |
| Driver portal | `src/features/drivers/` |
| SMTP / theme / operator settings | `src/features/settings/` |
| Form-builder canvas | `src/features/form-builder/` |
| shadcn primitive | `src/shared/ui/` |
| `connectDB` usage | `@/shared/db` |
| Copy | `messages/*.json` (all 8 locales) |
| A test | `*.test.ts` next to the file under test |

## Naming

- Folders: kebab-case
- React files: kebab-case (`step1-trip-details.tsx`)
- Hooks: `useThing.ts` (existing dominant style)
- Models: PascalCase files matching the document (`Booking.ts`)
- Services: `verb-noun.ts` (`finalize-paid-booking.ts`)
- Imports: `@/features/…` and `@/shared/…` — no `../../../`

## Config that must stay at repo root

`package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`, `.env.example`, `public/`.

next-intl request file: `src/shared/i18n/request.ts` (wired in `next.config.ts`).

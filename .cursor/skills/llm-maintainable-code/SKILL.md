---
name: llm-maintainable-code
description: Split god files, name things for humans and LLMs, and keep this taxi booking app easy to change. Use when refactoring, adding features, files exceed ~150 lines, or the user asks for maintainable/scalable/LLM-friendly structure.
---

# LLM-maintainable code

Write and refactor so a human **or** another model can find the rule, change one file, and not break payments.

## Before coding

1. Read `AGENTS.md` if not already in context.
2. Search for an existing `*.service.ts` / `*.repo.ts` / schema in `src/lib/` — extend that pattern, don't invent a third.
3. If the target file is already **>200 lines**, extract the concern you are touching into a sibling file as part of the same change.

## Size and shape

- Target **<150 lines**, split before **200**. One concern per file.
- Route / page / component = orchestration. Rules live in `src/lib/<domain>/`.
- Name files after the verb+noun: `finalize-paid-booking.ts`, `calculate-booking-price.ts`, `notify-eligible-partners.ts`.
- Named exports. Kebab-case files. PascalCase React functions.

```
# BAD — new logic appended to a 400-line route
src/app/api/booking/route.ts

# GOOD
src/app/api/booking/route.ts                 # parse + status
src/lib/bookings/create-booking.service.ts
src/lib/bookings/booking.repo.ts
src/lib/schemas/booking.schema.ts
```

## Boundaries LLMs must see

| Boundary | Parse / check |
|---|---|
| HTTP in | Zod schema |
| HTTP out | small JSON, no stack traces |
| DB | Mongoose model + repo |
| Money | `calculateBookingPrice` + provider verify |
| Auth | `getServerSession` + role |
| Copy | `messages/*.json` (8 locales) |

Do not duplicate types: Zod infers I/O; Mongoose infers documents.

## Refactor style (this repo, now)

- **Strangle, don't rewrite.** Move one function out of a fat route; leave callers working.
- Match local names (`connectDB`, `finalizePaidBooking`, `tripId`).
- No drive-by renames, no new folders at the repo root, no stack swaps.
- Independent I/O with `Promise.all`. No `any`. No swallowed `catch`.
- Avoid barrels that re-export everything. Import the file you mean.

## Checklist before finishing

- [ ] Touched file still under ~200 lines (or split)
- [ ] New user strings in all 8 locale files
- [ ] Prices not taken from the client
- [ ] No secrets logged
- [ ] `npm run lint` when the change is non-trivial

Deeper folder map: [reference.md](reference.md)

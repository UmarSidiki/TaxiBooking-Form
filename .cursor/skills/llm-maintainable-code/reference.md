# Folder map

Keep the current tree. Put **new** logic in the right column.

| Kind | Current examples | Prefer for new code |
|---|---|---|
| Pages | `src/app/[locale]/(pages)/dashboard/.../page.tsx` | Stay thin; extract to `src/features/<domain>/ui` |
| API | `src/app/api/booking/route.ts` | Thin `route.ts` + `src/features/<domain>/lib/*.service.ts` |
| Payments | `src/features/payments/lib/finalize-paid-booking.ts` | Keep adding files here, don't grow this one past 200 |
| Pricing | `src/features/payments/lib/calculate-booking-total.ts` | Reuse `calculateBookingPrice`; don't copy the formula |
| Models | `src/features/booking/model/Booking.ts` | Same; queries in `*.repo.ts` next to the model |
| Zod | `src/features/form-builder/schema/form-layout.schema.ts` | `src/features/<domain>/schema/<feature>.schema.ts` |
| Wizard | `src/features/booking/ui/steps/` + `src/features/booking/hooks/` | Keep step UI vs step hooks split |
| Email | `src/features/<domain>/email/` | Domain that owns the message |
| Copy | `messages/en.json` … `ar.json` | Always edit all 8 together |
| Tokens | `src/shared/style/globals.css` | No hex in components |
| DB | `src/shared/db` | `connectDB()` only |

## Split recipe

1. Identify the function or block you need to change.
2. Move it to `src/features/<domain>/lib/<verb>-<noun>.ts`.
3. Export a named function. Import it from the route/page.
4. Add Zod at the HTTP edge if the route still casts `as Type`.
5. Stop. Do not "while we're here" the rest of the file unless asked.

## Names to keep

`tripId`, `PendingBooking`, `Booking`, `finalizePaidBooking`, `connectDB`, `authOptions`, `orderId` (pending payment), `paymentStatus`, `status` (ride lifecycle: upcoming / completed / canceled).

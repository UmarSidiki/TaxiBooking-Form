# Folder map (current → prefer)

Keep the current tree. Put **new** logic in the right column.

| Kind | Current examples | Prefer for new code |
|---|---|---|
| Pages | `src/app/[locale]/(pages)/dashboard/.../page.tsx` | Stay thin; extract components |
| API | `src/app/api/booking/route.ts` (fat) | Thin `route.ts` + `src/lib/<domain>/*.service.ts` |
| Payments | `src/lib/payments/finalize-paid-booking.ts` | Keep adding files here, don't grow this one past 200 |
| Pricing | `src/lib/payments/calculate-booking-total.ts` | Reuse `calculateBookingPrice`; don't copy the formula |
| Models | `src/models/booking/Booking.ts` | Same; queries in `*.repo.ts` |
| Zod | `src/lib/schemas/form-layout.schema.ts` | `src/lib/schemas/<feature>.schema.ts` |
| Wizard | `src/components/form/steps/` + `src/hooks/form/` | Keep step UI vs step hooks split |
| Email | `src/controllers/email/` | Keep until a dedicated `src/lib/email/` migration is requested |
| Copy | `messages/en.json` … `ar.json` | Always edit all 8 together |
| Tokens | `src/style/globals.css` | No hex in components |

## Split recipe

1. Identify the function or block you need to change.
2. Move it to `src/lib/<domain>/<verb>-<noun>.ts`.
3. Export a named function. Import it from the route/page.
4. Add Zod at the HTTP edge if the route still casts `as Type`.
5. Stop. Do not "while we're here" the rest of the file unless asked.

## Names to keep

`tripId`, `PendingBooking`, `Booking`, `finalizePaidBooking`, `connectDB`, `authOptions`, `orderId` (pending payment), `paymentStatus`, `status` (ride lifecycle: upcoming / completed / canceled).

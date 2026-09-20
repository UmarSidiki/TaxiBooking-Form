# Payments

Stripe, MultiSafepay, cash finalize. Provider says paid → `finalizePaidBooking`. Recompute fares server-side.

**Import:** `@/features/payments/lib/finalize-paid-booking`, `@/features/payments/lib/calculate-booking-total`, Stripe UI `@/features/payments/ui/stripe-payment-form`.

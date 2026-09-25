# Payments

Stripe, MultiSafepay, cash finalize. Provider says paid → `finalizePaidBooking`. Recompute fares server-side.

**Import:** `@/features/payments/lib/finalize-paid-booking`, `@/features/payments/lib/fare/calculate-booking-price` (the single fare authority), Stripe UI `@/features/payments/ui/stripe-payment-form`.

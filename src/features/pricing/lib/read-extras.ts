import { defaultExtras, EXTRA_KEYS, type PricingExtras } from "@/features/pricing/lib/quote-fare";

export function readExtras(stored: Partial<PricingExtras> | undefined | null): PricingExtras {
  const extras = defaultExtras();
  for (const key of EXTRA_KEYS) {
    const value = stored?.[key];
    if (value) extras[key] = { enabled: Boolean(value.enabled), price: Number(value.price) || 0 };
  }
  return extras;
}

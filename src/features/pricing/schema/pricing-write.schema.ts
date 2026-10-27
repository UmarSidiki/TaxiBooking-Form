import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const extra = z.object({ enabled: z.boolean(), price: z.coerce.number().min(0).max(10_000) });

/** Accepts legacy `{ date }` rows for one release; stored as `{ start, end }`. */
const holiday = z
  .object({
    start: day.optional(),
    end: day.optional(),
    date: day.optional(),
    percent: z.coerce.number().min(0).max(200),
  })
  .transform((row) => {
    const start = row.start ?? row.date ?? "";
    return { start, end: row.end ?? start, percent: row.percent };
  })
  .refine((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.start) && row.start <= row.end, {
    message: "end_before_start",
  });

export const pricingRuleWriteSchema = z.object({
  nightStart: z.string().regex(/^\d{2}:\d{2}$/),
  nightEnd: z.string().regex(/^\d{2}:\d{2}$/),
  nightPercent: z.coerce.number().min(0).max(200),
  holidays: z.array(holiday).max(60),
  extras: z.object({ meetGreet: extra, childSeat: extra, babySeat: extra }),
  depositPercent: z.coerce.number().min(0).max(100).optional(),
});

const place = z.object({
  label: z.string().trim().min(2).max(200),
  placeId: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(50),
});

export const fixedRouteWriteSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  from: z.array(place).min(1).max(20),
  to: z.array(place).min(1).max(20),
  price: z.coerce.number().min(0),
  bothWays: z.boolean().default(false),
});

export const promoWriteSchema = z.object({
  code: z.string().trim().min(2).max(40),
  kind: z.enum(["percent", "fixed"]),
  amount: z.coerce.number().positive(),
  expiresAt: z.string().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  maxUsesPerCustomer: z.coerce.number().int().positive().optional(),
});

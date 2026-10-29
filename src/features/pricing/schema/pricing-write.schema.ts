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

export const promoActiveSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
  active: z.boolean(),
});

export const promoWriteSchema = z.object({
  code: z.string().trim().min(2).max(40),
  kind: z.enum(["percent", "fixed"]),
  amount: z.coerce.number().positive(),
  active: z.boolean().optional(),
  expiresAt: z.string().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  maxUsesPerCustomer: z.coerce.number().int().positive().optional(),
});

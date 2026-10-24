import { z } from "zod";

export const pricingRuleWriteSchema = z.object({
  nightStart: z.string().regex(/^\d{2}:\d{2}$/),
  nightEnd: z.string().regex(/^\d{2}:\d{2}$/),
  nightPercent: z.coerce.number().min(0).max(200),
  holidays: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    percent: z.coerce.number().min(0).max(200),
  })).max(60),
  meetGreetPrice: z.coerce.number().min(0),
  operatorMinimumFare: z.coerce.number().min(0),
});

export const zonePriceWriteSchema = z.object({
  fromLabel: z.string().trim().min(3).max(80),
  toLabel: z.string().trim().min(3).max(80),
  price: z.coerce.number().min(0),
});

export const promoWriteSchema = z.object({
  code: z.string().trim().min(2).max(40),
  kind: z.enum(["percent", "fixed"]),
  amount: z.coerce.number().positive(),
  expiresAt: z.string().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  maxUsesPerCustomer: z.coerce.number().int().positive().optional(),
});

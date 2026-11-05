import { z } from "zod";
import { checkoutBookingDataSchema } from "@/features/booking/schema/checkout.schema";

export const quoteRequestSchema = checkoutBookingDataSchema.extend({
  promoCode: z.string().trim().max(40).optional(),
  meetAndGreet: z.boolean().optional(),
  /** Preview only. The charge path measures the route again. */
  distanceKm: z.number().nonnegative().optional(),
  /** Selects the deposit rule (online, cash, or appointment). */
  paymentMethod: z
    .enum(["card", "multisafepay", "cash", "appointment"])
    .optional(),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

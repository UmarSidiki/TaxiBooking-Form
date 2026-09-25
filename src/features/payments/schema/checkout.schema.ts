import { z } from "zod";
import { checkoutBookingDataSchema } from "@/features/booking/schema/checkout.schema";

export const paymentIntentBodySchema = z.object({
  amount: z.number().optional(),
  currency: z.string().optional(),
  customerEmail: z.string().optional(),
  customerName: z.string().optional(),
  description: z.string().optional(),
  bookingData: checkoutBookingDataSchema,
});

export const completePaymentBodySchema = z
  .object({
    provider: z.enum(["stripe", "multisafepay"]),
    paymentIntentId: z.string().optional(),
    transactionId: z.string().optional(),
    orderId: z.string().optional(),
  })
  .refine(
    (data) => Boolean(data.paymentIntentId || data.transactionId || data.orderId),
    { path: ["orderId"] }
  );

export const multisafepayOrderBodySchema = z.object({
  /** Advisory only - the server recomputes and charges the authoritative fare. */
  amount: z.number().optional(),
  currency: z.string().optional(),
  customerEmail: z.string().optional(),
  customerName: z.string().optional(),
  description: z.string().optional(),
  orderId: z.string().optional(),
  locale: z.string().optional(),
  bookingData: checkoutBookingDataSchema,
});

export const cancelMultisafepayBodySchema = z
  .object({
    transactionId: z.string().optional(),
    orderId: z.string().optional(),
  })
  .refine((data) => Boolean(data.transactionId || data.orderId), {
    path: ["orderId"],
  });

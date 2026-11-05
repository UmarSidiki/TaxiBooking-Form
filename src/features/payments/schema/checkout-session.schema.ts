import { z } from "zod";
import { checkoutBookingDataSchema } from "@/features/booking/schema/checkout.schema";

export const checkoutSessionBodySchema = z.object({
  /** Client UUID, stable for one booking attempt. */
  draftId: z.string().uuid(),
  customerEmail: z.string().optional(),
  customerName: z.string().optional(),
  description: z.string().optional(),
  /** Selects the deposit rule; "cash"/"appointment" collect only that deposit. */
  paymentMethod: z.enum(["card", "cash", "appointment"]).optional(),
  bookingData: checkoutBookingDataSchema,
});

export const checkoutCancelBodySchema = z.object({
  draftId: z.string().uuid(),
});

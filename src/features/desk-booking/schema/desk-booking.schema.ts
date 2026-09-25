import { z } from "zod";
import {
  cashBookingBaseSchema,
  requireDropoffOrStop,
} from "@/features/booking/schema/cash-booking.schema";

export const DESK_BOOKING_OUTCOMES = ["confirmed", "quote"] as const;
export const DESK_PAYMENT_METHODS = ["cash", "card", "bank_transfer"] as const;

/**
 * Operator-authored Booking. Price fields are omitted on purpose: the fare is
 * computed server-side and the only sanctioned override is `manualPrice`.
 */
export const deskBookingInputSchema = cashBookingBaseSchema
  .omit({
    paymentMethod: true,
    paymentStatus: true,
    stripePaymentIntentId: true,
    totalAmount: true,
    subtotalAmount: true,
    taxAmount: true,
    taxPercentage: true,
  })
  .extend({
    outcome: z.enum(DESK_BOOKING_OUTCOMES).default("confirmed"),
    manualPrice: z.number().positive().optional(),
    paymentMethod: z.enum(DESK_PAYMENT_METHODS).optional(),
    paymentCollected: z.boolean().optional().default(false),
    notifyCustomer: z.boolean().optional().default(true),
  })
  .superRefine(requireDropoffOrStop);

export type DeskBookingInput = z.infer<typeof deskBookingInputSchema>;
export type DeskBookingOutcome = (typeof DESK_BOOKING_OUTCOMES)[number];

type ParseOk = { success: true; data: DeskBookingInput };
type ParseErr = { success: false; error: "invalid_body" };

export function parseDeskBookingInput(body: unknown): ParseOk | ParseErr {
  const parsed = deskBookingInputSchema.safeParse(body);
  if (!parsed.success) {
    return { success: false, error: "invalid_body" };
  }
  return { success: true, data: parsed.data };
}

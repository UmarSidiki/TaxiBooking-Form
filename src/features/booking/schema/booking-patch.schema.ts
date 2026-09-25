import { z } from "zod";
import { mongoIdSchema } from "@/shared/schema/mongo-id";

export const BOOKING_PATCH_ACTIONS = [
  "cancel",
  "complete",
  "assign",
  "assignpartner",
  "approvepartner",
  "quote",
  "confirmcash",
  "decline",
] as const;

export const bookingPatchActionSchema = z.enum(BOOKING_PATCH_ACTIONS);

export type BookingPatchAction = z.infer<typeof bookingPatchActionSchema>;

export const bookingPatchBodySchema = z.object({
  action: z.string().transform((value) => value.toLowerCase()),
  refundPercentage: z.coerce.number().min(0).max(100).optional(),
  driverId: mongoIdSchema.optional(),
  partnerId: mongoIdSchema.optional(),
  marginPercentage: z.coerce.number().optional(),
  /** When approving for partners: open overflow marketplace (default true). */
  notifyPartners: z.boolean().optional(),
  quotedAmount: z.coerce.number().min(0).optional(),
  declineReason: z.string().max(500).optional(),
});

export type BookingPatchBody = z.infer<typeof bookingPatchBodySchema> & {
  action: BookingPatchAction;
};

type ParseOk = { success: true; data: BookingPatchBody };
type ParseErr = { success: false; status: 400; error: "invalid_body" };

export function parseBookingPatchBody(body: unknown): ParseOk | ParseErr {
  const parsed = bookingPatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return { success: false, status: 400, error: "invalid_body" };
  }

  const action = bookingPatchActionSchema.safeParse(parsed.data.action);
  if (!action.success) {
    return { success: false, status: 400, error: "invalid_body" };
  }

  return {
    success: true,
    data: { ...parsed.data, action: action.data },
  };
}

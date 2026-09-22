import { z } from "zod";
import {
  isValidEmail,
  isValidName,
  isValidPhone,
} from "@/shared/lib/validation";

const MAX_SEATS = 10;

export const cashBookingStopSchema = z.object({
  location: z.string().trim().min(1),
  order: z.number().int().min(0),
  duration: z.number().nonnegative().optional(),
});

export const cashBookingInputSchema = z
  .object({
    bookingType: z.enum(["destination", "hourly"]).optional(),
    pickup: z.string().trim().min(1),
    dropoff: z.string().optional(),
    stops: z.array(cashBookingStopSchema).optional(),
    tripType: z.enum(["oneway", "roundtrip"]).default("oneway"),
    duration: z.number().positive().optional(),
    date: z.string().min(1),
    time: z.string().min(1),
    returnDate: z.string().optional(),
    returnTime: z.string().optional(),
    passengers: z.coerce.number().int().min(1).max(50).default(1),
    selectedVehicle: z.string().min(1),
    childSeats: z.coerce.number().int().min(0).max(MAX_SEATS).default(0),
    babySeats: z.coerce.number().int().min(0).max(MAX_SEATS).default(0),
    notes: z.string().optional().default(""),
    flightNumber: z.string().optional(),
    firstName: z.string().trim().min(1).refine(isValidName),
    lastName: z.string().trim().min(1).refine(isValidName),
    email: z.string().trim().refine(isValidEmail),
    phone: z.string().trim().refine(isValidPhone),
    whatsappOptIn: z.boolean().optional().default(false),
    locale: z.string().trim().max(8).optional(),
    paymentMethod: z.string().optional(),
    paymentStatus: z.string().optional(),
    stripePaymentIntentId: z.string().optional(),
    totalAmount: z.number().optional(),
    subtotalAmount: z.number().optional(),
    taxAmount: z.number().optional(),
    taxPercentage: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.bookingType === "destination" &&
      !data.dropoff &&
      (!data.stops || data.stops.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dropoff"],
      });
    }
  });

export type CashBookingInput = z.infer<typeof cashBookingInputSchema>;

type ParseOk = { success: true; data: CashBookingInput };
type ParseErr = { success: false; error: "invalid_body" };

export function parseCashBookingInput(body: unknown): ParseOk | ParseErr {
  const parsed = cashBookingInputSchema.safeParse(body);
  if (!parsed.success) {
    return { success: false, error: "invalid_body" };
  }
  return { success: true, data: parsed.data };
}

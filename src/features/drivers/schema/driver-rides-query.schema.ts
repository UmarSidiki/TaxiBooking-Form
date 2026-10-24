import { z } from "zod";
import { mongoIdSchema } from "@/shared/schema/mongo-id";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

export const driverRidesQuerySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  afterDate: dateSchema.optional(),
  afterTime: timeSchema.optional(),
  afterId: mongoIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type DriverRidesQuery = z.infer<typeof driverRidesQuerySchema>;

export const DRIVER_RIDE_PAGE_SIZE = 50;

/** Fields the driver desk renders. Payment secrets and partner ledger fields stay off the wire. */
export const DRIVER_RIDE_FIELDS = [
  "tripId",
  "pickup",
  "dropoff",
  "stops",
  "tripType",
  "bookingType",
  "date",
  "time",
  "returnDate",
  "returnTime",
  "passengers",
  "selectedVehicle",
  "vehicleDetails",
  "childSeats",
  "babySeats",
  "notes",
  "flightNumber",
  "firstName",
  "lastName",
  "email",
  "phone",
  "paymentMethod",
  "paymentStatus",
  "status",
  "totalAmount",
  "refundAmount",
  "refundPercentage",
  "canceledAt",
].join(" ");

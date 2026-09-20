import { z } from "zod";
import { cashBookingStopSchema } from "@/features/booking/schema/cash-booking.schema";

export const pendingBookingDataSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  flightNumber: z.string().optional(),
});

export const pendingBookingUpdateSchema = z.object({
  orderId: z.string().min(1),
  bookingData: pendingBookingDataSchema,
});

export const checkoutBookingDataSchema = z.object({
  bookingType: z.enum(["destination", "hourly"]).optional(),
  pickup: z.string().optional(),
  dropoff: z.string().optional(),
  stops: z.array(cashBookingStopSchema).optional(),
  tripType: z.enum(["oneway", "roundtrip"]).optional(),
  duration: z.number().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  returnDate: z.string().optional(),
  returnTime: z.string().optional(),
  passengers: z.coerce.number().optional(),
  selectedVehicle: z.string().min(1),
  childSeats: z.coerce.number().optional(),
  babySeats: z.coerce.number().optional(),
  notes: z.string().optional(),
  flightNumber: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export const distanceRequestSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  stops: z.array(z.string()).optional().default([]),
  isRoundTrip: z.boolean().optional(),
});

import { z } from "zod";

export const vehicleWriteSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  image: z.string().optional(),
  persons: z.coerce.number().int().min(1).max(50),
  baggages: z.coerce.number().int().min(0).max(20).optional(),
  price: z.coerce.number().min(0),
  pricePerKm: z.coerce.number().min(0).optional(),
  pricePerHour: z.coerce.number().min(0).optional(),
  minimumFare: z.coerce.number().min(0).optional(),
  minimumHours: z.coerce.number().min(0).optional(),
  returnPricePercentage: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),
  category: z.string().trim().min(1),
  childSeatPrice: z.coerce.number().min(0).optional(),
  babySeatPrice: z.coerce.number().min(0).optional(),
  stopPrice: z.coerce.number().min(0).optional(),
  stopPricePerHour: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const vehiclePatchSchema = vehicleWriteSchema.partial();

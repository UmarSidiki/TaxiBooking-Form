import { z } from "zod";

export const driverRideActionSchema = z.object({
  action: z.enum(["started", "arrived", "completed", "no_show"]),
  cashCollected: z.coerce.number().min(0).max(1_000_000).optional(),
});

export type DriverRideAction = z.infer<typeof driverRideActionSchema>;

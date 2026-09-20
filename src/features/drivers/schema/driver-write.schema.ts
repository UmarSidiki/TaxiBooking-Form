import { z } from "zod";
import { isValidEmail } from "@/shared/lib/validation";
import { mongoIdSchema } from "@/shared/schema/mongo-id";

export const driverWriteSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().refine(isValidEmail),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  assignedVehicle: mongoIdSchema.optional(),
});

export const driverCreateSchema = driverWriteSchema.extend({
  password: z.string().min(8),
});

export const driverPatchSchema = driverWriteSchema.partial();

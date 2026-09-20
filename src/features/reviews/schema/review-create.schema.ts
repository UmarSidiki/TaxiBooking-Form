import { z } from "zod";
import { mongoIdSchema } from "@/shared/schema/mongo-id";

export const reviewCreateSchema = z.object({
  bookingId: mongoIdSchema,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
});

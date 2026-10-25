import { z } from "zod";

export const driverTimeOffSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  note: z.string().trim().max(300).optional(),
}).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
  path: ["endsAt"],
});

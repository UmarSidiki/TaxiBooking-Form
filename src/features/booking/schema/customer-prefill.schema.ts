import { z } from "zod";

/** Subset of GET /api/account/me that the booking form can prefill. */
export const customerPrefillSchema = z.object({
  email: z.string().trim().min(1),
  name: z.string().trim().optional().default(""),
  verifiedPhone: z.string().trim().optional().default(""),
  preferences: z
    .object({
      whatsappOptIn: z.boolean().optional(),
    })
    .optional(),
});

export type CustomerPrefill = z.infer<typeof customerPrefillSchema>;

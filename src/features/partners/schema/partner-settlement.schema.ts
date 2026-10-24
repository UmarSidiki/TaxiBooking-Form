import { z } from "zod";

export const partnerSettlementSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000),
  direction: z.enum(["pay_partner", "receive_from_partner"]),
  method: z.enum(["cash", "bank", "other"]),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

export type PartnerSettlementInput = z.infer<typeof partnerSettlementSchema>;

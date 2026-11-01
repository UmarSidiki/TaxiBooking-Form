import { z } from "zod";
import { MARKETING_CHANNELS } from "@/features/marketing/lib/marketing.constants";

export const marketingChannelSchema = z.enum(MARKETING_CHANNELS);

export const adminMarketingActionSchema = z
  .object({
    channel: marketingChannelSchema,
    action: z.enum(["withdraw", "record_offline"]),
    reason: z.string().trim().max(500).default(""),
    textVersion: z.string().trim().max(40).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "record_offline" && value.reason.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "reason_required",
      });
    }
  });

export type AdminMarketingAction = z.infer<typeof adminMarketingActionSchema>;

export const unsubscribeActionSchema = z.object({
  token: z.string().min(10).max(4096),
  action: z.enum(["unsubscribe", "resubscribe"]).default("unsubscribe"),
});

export type UnsubscribeAction = z.infer<typeof unsubscribeActionSchema>;

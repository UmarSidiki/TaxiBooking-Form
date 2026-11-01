import { z } from "zod";
import { marketingChannelSchema } from "@/features/marketing/schema/marketing.schema";

export const campaignStatusSchema = z.enum([
  "draft",
  "scheduled",
  "sending",
  "paused",
  "done",
  "cancelled",
]);

export const campaignWriteSchema = z.object({
  name: z.string().trim().min(1).max(200),
  channel: marketingChannelSchema,
  segmentId: z.string().trim().min(1).optional().nullable(),
  templateId: z.string().trim().min(1).optional().nullable(),
  templateVersion: z.number().int().positive().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  throttle: z
    .object({
      perRun: z.number().int().min(1).max(500).default(50),
      dailyCap: z.number().int().min(0).max(100000).default(0),
    })
    .optional(),
  quietHours: z
    .object({
      startHour: z.number().int().min(0).max(23).default(20),
      endHour: z.number().int().min(0).max(23).default(9),
      timeZone: z.string().trim().min(1).max(64).default("UTC"),
    })
    .optional(),
});

export type CampaignWriteInput = z.infer<typeof campaignWriteSchema>;

export const campaignUpdateSchema = campaignWriteSchema.partial();

export const campaignScheduleSchema = z.object({
  scheduledAt: z.string().datetime().optional().nullable(),
  confirmationText: z.string().trim().max(200).optional(),
});

export const campaignActionSchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]).optional(),
});

export const campaignListQuerySchema = z.object({
  status: campaignStatusSchema.optional(),
  channel: marketingChannelSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
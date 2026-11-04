import { z } from "zod";
import {
  customerListQuerySchema,
  type CustomerListParams,
} from "@/features/customers-admin/schema/customer-list.schema";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";

/**
 * A segment stores the C2 customer-list filters verbatim. Pagination and sort
 * are not part of an audience, so they are stripped before validation.
 */
export const segmentFilterSchema = customerListQuerySchema.omit({
  cursor: true,
  sort: true,
  dir: true,
});

export type SegmentFilter = z.infer<typeof segmentFilterSchema>;

export const segmentWriteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  filter: segmentFilterSchema,
});

export type SegmentWriteInput = z.infer<typeof segmentWriteSchema>;

export const segmentUpdateSchema = segmentWriteSchema.partial();

export type SegmentUpdateInput = z.infer<typeof segmentUpdateSchema>;

/** Stored filters may predate a schema field; normalise on read. */
export function parseSegmentFilter(value: unknown): SegmentFilter | null {
  const parsed = segmentFilterSchema.safeParse(value);
  if (!parsed.success) return null;
  // Consent and the verified-number gate belong to the campaign channel, not
  // to a saved audience. Clearing them here prevents a stale filter from
  // narrowing the other channel or weakening the gate.
  return {
    ...parsed.data,
    emailConsent: "any",
    whatsappConsent: "any",
    verifiedWhatsApp: "any",
  };
}

/**
 * Consent is a channel decision, not an audience decision: every segment
 * query forces the channel's consent on and, for WhatsApp, a verified number.
 * Callers cannot relax this through the saved filter.
 */
export function segmentFilterBase(
  filter: SegmentFilter,
): CustomerListParams {
  return { ...filter, sort: "last-ride", dir: "desc", cursor: undefined };
}

export function segmentFilterForChannel(
  filter: SegmentFilter,
  channel: MarketingChannel,
): CustomerListParams {
  return {
    ...segmentFilterBase(filter),
    emailConsent: channel === "email" ? "granted" : filter.emailConsent,
    whatsappConsent:
      channel === "whatsapp" ? "granted" : filter.whatsappConsent,
    verifiedWhatsApp:
      channel === "whatsapp" ? "yes" : filter.verifiedWhatsApp,
  };
}

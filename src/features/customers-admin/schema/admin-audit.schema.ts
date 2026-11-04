import { z } from "zod";

import { ADMIN_AUDIT_ACTIONS } from "@/features/customers-admin/lib/audit/audit-actions";
import { isDateOnly } from "@/features/customers-admin/lib/audit/is-date-only";

const dateOnly = z.string().trim().refine(isDateOnly);

export const adminAuditQuerySchema = z.object({
  action: z
    .union([z.literal("any"), z.enum(ADMIN_AUDIT_ACTIONS)])
    .default("any"),
  target: z.string().trim().max(320).default(""),
  actor: z.string().trim().max(320).default(""),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  cursor: z.string().max(400).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const adminActivityQuerySchema = z.object({
  cursor: z.string().max(400).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;
export type AdminActivityQuery = z.infer<typeof adminActivityQuerySchema>;

export const DEFAULT_ADMIN_AUDIT_QUERY: AdminAuditQuery = adminAuditQuerySchema.parse({});

export function toAdminAuditSearchString(
  params: AdminAuditQuery,
  cursor?: string,
): string {
  const search = new URLSearchParams();
  if (params.action !== "any") search.set("action", params.action);
  if (params.target) search.set("target", params.target);
  if (params.actor) search.set("actor", params.actor);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.limit !== 50) search.set("limit", String(params.limit));
  if (cursor) search.set("cursor", cursor);
  return search.toString();
}

export function auditDateRange(params: {
  from?: string;
  to?: string;
}): { from?: Date; to?: Date } {
  const from = params.from ? new Date(`${params.from}T00:00:00.000Z`) : undefined;
  const to = params.to ? new Date(`${params.to}T23:59:59.999Z`) : undefined;
  return {
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
  };
}

import type { AdminAuditAction } from "@/features/customers-admin/lib/audit/audit-actions";
import { formatProfileDateTime } from "@/features/customers-admin/ui/customer-profile-format";

const ACTION_KEYS: Record<AdminAuditAction, string> = {
  "customer.view_export": "action-customer-view-export",
  "customer.note.create": "action-customer-note-create",
  "customer.note.update": "action-customer-note-update",
  "customer.note.delete": "action-customer-note-delete",
  "customer.sessions.revoke": "action-customer-sessions-revoke",
  "customer.sessions.revoke_all": "action-customer-sessions-revoke-all",
  "customer.consent.withdraw": "action-customer-consent-withdraw",
  "campaign.create": "action-campaign-create",
  "campaign.schedule": "action-campaign-schedule",
  "campaign.send": "action-campaign-send",
  "campaign.cancel": "action-campaign-cancel",
  "csv.export": "action-csv-export",
};

export function auditActionKey(action: string): string {
  return ACTION_KEYS[action as AdminAuditAction] ?? "action-unknown";
}

export function auditTargetKey(targetType: string): string {
  if (targetType === "customer") return "target-customer";
  if (targetType === "campaign") return "target-campaign";
  if (targetType === "export") return "target-export";
  return "target-customer";
}

export function formatAuditDateTime(value: string, locale: string): string | null {
  return formatProfileDateTime(value, locale);
}

/** Safe, human-readable metadata. Never contains note bodies or codes. */
export function formatAuditMetadata(
  metadata: Record<string, string | number | boolean | null>,
): string {
  return Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

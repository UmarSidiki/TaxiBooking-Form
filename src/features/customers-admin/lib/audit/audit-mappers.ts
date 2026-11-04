import type {
  AdminAuditDoc,
  AdminAuditMetadataRow,
  AdminAuditRow,
} from "@/features/customers-admin/lib/audit/audit.types";

function scalarMetadata(value: unknown): AdminAuditMetadataRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const row: AdminAuditMetadataRow = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (item === null || ["string", "number", "boolean"].includes(typeof item)) {
      row[key] = item as string | number | boolean | null;
    } else {
      row[key] = JSON.stringify(item)?.slice(0, 160) ?? "";
    }
  }
  return row;
}

export function toAdminAuditRow(doc: AdminAuditDoc): AdminAuditRow {
  return {
    id: String(doc._id),
    action: doc.action,
    targetType: doc.targetType,
    targetId: doc.targetId,
    actorId: doc.actorId ?? "",
    actorEmail: doc.actorEmail ?? "",
    actorName: doc.actorName ?? "",
    actorRole: doc.actorRole ?? "",
    metadata: scalarMetadata(doc.metadata),
    ipPrefix: doc.ipPrefix ?? "",
    at: doc.at.toISOString(),
  };
}

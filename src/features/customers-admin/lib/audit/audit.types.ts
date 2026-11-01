import type {
  AdminAuditAction,
  AdminAuditTargetType,
} from "@/features/customers-admin/lib/audit/audit-actions";

export type AdminAuditMetadataRow = Record<string, string | number | boolean | null>;

export type AdminAuditRow = {
  id: string;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  metadata: AdminAuditMetadataRow;
  ipPrefix: string;
  at: string;
};

export type AdminAuditDoc = {
  _id: unknown;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  metadata?: unknown;
  ipPrefix?: string | null;
  at: Date;
};

export type AdminAuditListPage = {
  ok: true;
  rows: AdminAuditRow[];
  nextCursor: string | null;
};

export type AdminAuditListFailure = {
  ok: false;
  error: "invalid_cursor";
};

export type AdminAuditListResult = AdminAuditListPage | AdminAuditListFailure;

export type AdminAuditResponse = {
  success: true;
  rows: AdminAuditRow[];
  nextCursor: string | null;
};

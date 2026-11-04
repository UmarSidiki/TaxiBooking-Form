import mongoose, { Schema, Document } from "mongoose";

import type {
  AdminAuditAction,
  AdminAuditTargetType,
} from "@/features/customers-admin/lib/audit/audit-actions";

/** Audit rows are kept for two years, then Mongo expires them. */
export const ADMIN_AUDIT_RETENTION_SECONDS = 2 * 365 * 24 * 60 * 60;

export interface IAdminAuditLog extends Document {
  actorId: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId: string;
  /** Safe metadata only: counts and ids, never note bodies, codes or messages. */
  metadata: Record<string, unknown>;
  ipPrefix: string;
  at: Date;
}

const AdminAuditLogSchema = new Schema(
  {
    actorId: { type: String, default: "" },
    actorEmail: { type: String, default: "" },
    actorName: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipPrefix: { type: String, default: "" },
    at: { type: Date, default: Date.now, required: true },
  },
  { timestamps: false },
);

AdminAuditLogSchema.index({ at: 1 }, { expireAfterSeconds: ADMIN_AUDIT_RETENTION_SECONDS });
AdminAuditLogSchema.index({ at: -1, _id: -1 });
AdminAuditLogSchema.index({ action: 1, at: -1 });
AdminAuditLogSchema.index({ targetType: 1, targetId: 1, at: -1 });
AdminAuditLogSchema.index({ actorEmail: 1, at: -1 });

const AdminAuditLog =
  mongoose.models.AdminAuditLog ||
  mongoose.model<IAdminAuditLog>("AdminAuditLog", AdminAuditLogSchema);

export default AdminAuditLog;

import mongoose from "mongoose";

import { connectDB } from "@/shared/db";
import AdminAuditLog from "@/features/customers-admin/model/AdminAuditLog";
import {
  encodeAdminAuditCursor,
  decodeAdminAuditCursor,
} from "@/features/customers-admin/lib/audit/audit-cursor";
import { toAdminAuditRow } from "@/features/customers-admin/lib/audit/audit-mappers";
import type {
  AdminAuditDoc,
  AdminAuditListResult,
} from "@/features/customers-admin/lib/audit/audit.types";
import type {
  AdminAuditAction,
  AdminAuditTargetType,
} from "@/features/customers-admin/lib/audit/audit-actions";

export type ListAdminAuditParams = {
  action?: AdminAuditAction;
  targetType?: AdminAuditTargetType;
  targetId?: string;
  actorPrefix?: string;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit: number;
};

/**
 * Cursor page over AdminAuditLog, newest first. Actor filtering is an index
 * range prefix, never a regex scan.
 */
export async function listAdminAudit(
  params: ListAdminAuditParams,
): Promise<AdminAuditListResult> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (params.action) query.action = params.action;
  if (params.targetType) query.targetType = params.targetType;
  if (params.targetId) query.targetId = params.targetId.trim().toLowerCase();
  if (params.actorPrefix) {
    const prefix = params.actorPrefix.trim().toLowerCase();
    query.actorEmail = { $gte: prefix, $lt: `${prefix}\uffff` };
  }
  if (params.from || params.to) {
    query.at = {
      ...(params.from ? { $gte: params.from } : {}),
      ...(params.to ? { $lte: params.to } : {}),
    };
  }
  if (params.cursor) {
    const cursor = decodeAdminAuditCursor(params.cursor);
    if (!cursor) return { ok: false, error: "invalid_cursor" };
    query.$and = [
      {
        $or: [
          { at: { $lt: cursor.at } },
          { at: cursor.at, _id: { $lt: new mongoose.Types.ObjectId(cursor.id) } },
        ],
      },
    ];
  }

  const docs = await AdminAuditLog.find(query)
    .sort({ at: -1, _id: -1 })
    .limit(params.limit + 1)
    .lean<AdminAuditDoc[]>();
  const hasMore = docs.length > params.limit;
  const page = hasMore ? docs.slice(0, params.limit) : docs;
  const last = page[page.length - 1];

  return {
    ok: true,
    rows: page.map(toAdminAuditRow),
    nextCursor:
      hasMore && last
        ? encodeAdminAuditCursor(last.at, String(last._id))
        : null,
  };
}

import { connectDB } from "@/shared/db";
import { clientIp } from "@/shared/http/client-ip";
import AdminAuditLog from "@/features/customers-admin/model/AdminAuditLog";
import type {
  AdminAuditAction,
  AdminAuditTargetType,
} from "@/features/customers-admin/lib/audit/audit-actions";

export type AdminAuditActor = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

export type AdminAuditMetadata = Record<string, string | number | boolean | null>;

/** Coarse network signal only; the full address is never stored. */
export function auditIpPrefix(request?: Request): string {
  if (!request) return "";
  const ip = clientIp(request);
  if (!ip || ip === "unknown") return "";
  return ip.includes(":")
    ? ip.split(":").slice(0, 4).join(":")
    : ip.split(".").slice(0, 2).join(".");
}

export async function recordAdminAudit(input: {
  actor: AdminAuditActor;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId: string;
  metadata?: AdminAuditMetadata;
  request?: Request;
}): Promise<void> {
  await connectDB();
  await AdminAuditLog.create({
    actorId: input.actor.id ?? "",
    actorEmail: (input.actor.email ?? "").trim().toLowerCase(),
    actorName: input.actor.name ?? "",
    actorRole: input.actor.role ?? "",
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId.trim().toLowerCase(),
    metadata: input.metadata ?? {},
    ipPrefix: auditIpPrefix(input.request),
    at: new Date(),
  });
}

/**
 * Actions recorded in AdminAuditLog. Kept free of Mongoose imports so client
 * components can use the list for filters without bundling the model.
 */
export const ADMIN_AUDIT_ACTIONS = [
  "customer.view_export",
  "customer.note.create",
  "customer.note.update",
  "customer.note.delete",
  "customer.sessions.revoke",
  "customer.sessions.revoke_all",
  "customer.consent.withdraw",
  "campaign.create",
  "campaign.schedule",
  "campaign.send",
  "campaign.cancel",
  "csv.export",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export const ADMIN_AUDIT_TARGET_TYPES = ["customer", "campaign", "export"] as const;

export type AdminAuditTargetType = (typeof ADMIN_AUDIT_TARGET_TYPES)[number];

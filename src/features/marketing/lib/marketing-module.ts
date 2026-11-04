import { connectDB } from "@/shared/db";
import Setting from "@/features/settings/model/Setting";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

/** True unless the operator switched the Marketing module off (missing field means on). */
export async function isMarketingEnabled(): Promise<boolean> {
  await connectDB();
  const row = await Setting.findOne()
    .select({ enableMarketing: 1 })
    .lean<{ enableMarketing?: boolean } | null>();
  return row?.enableMarketing !== false;
}

/** requireAdmin, plus 403 `module_disabled` while the Marketing module is off. */
export async function requireMarketingAdmin() {
  const access = await requireAdmin();
  if (!access.ok) return access;
  if (!(await isMarketingEnabled())) {
    return { ok: false as const, response: jsonError("module_disabled", 403) };
  }
  return access;
}

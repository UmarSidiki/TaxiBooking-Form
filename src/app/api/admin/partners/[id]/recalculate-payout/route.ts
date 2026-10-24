import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";

/** Balance is the ledger. Replaying note text is no longer supported. */
export async function POST() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  return NextResponse.json(
    { success: false, error: "gone" },
    { status: 410 },
  );
}

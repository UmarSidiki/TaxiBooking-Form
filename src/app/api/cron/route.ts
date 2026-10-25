import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/shared/http/is-cron-authorized";
import { limitSensitive } from "@/shared/http/sensitive-limit";

export const dynamic = "force-dynamic";

async function handle(req: Request) {
  if (!isCronAuthorized(req)) {
    const limited = await limitSensitive(req, "cronfail");
    if (limited) return limited;
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { runCron } = await import("@/features/cron/lib/run-cron");
  const body = await runCron();
  return NextResponse.json(body, { status: body.ok ? 200 : 500 });
}

export const GET = handle;
export const POST = handle;

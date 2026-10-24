import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/shared/http/is-cron-authorized";

export const dynamic = "force-dynamic";

async function handle(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { runCron } = await import("@/features/cron/lib/run-cron");
  const body = await runCron();
  return NextResponse.json(body, { status: body.ok ? 200 : 500 });
}

export const GET = handle;
export const POST = handle;

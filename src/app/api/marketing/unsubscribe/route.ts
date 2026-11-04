import { NextResponse } from "next/server";
import { jsonError } from "@/shared/http/json-error";
import { auditIpPrefix } from "@/features/customers-admin/lib/audit/record-admin-audit";
import { unsubscribeWithToken } from "@/features/marketing/lib/unsubscribe/unsubscribe.service";
import { unsubscribeActionSchema } from "@/features/marketing/schema/marketing.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tokenFromUrl(request: Request): string {
  return new URL(request.url).searchParams.get("token") ?? "";
}

function resultResponse(
  result: Awaited<ReturnType<typeof unsubscribeWithToken>>,
) {
  if (!result.ok) return jsonError("invalid_token", 400);
  return NextResponse.json({
    success: true,
    channel: result.channel,
    status: result.status,
  });
}

/** Human fallback and simple GET clients; the token is purpose-signed. */
export async function GET(request: Request) {
  try {
    const result = await unsubscribeWithToken(tokenFromUrl(request), {
      ipPrefix: auditIpPrefix(request),
    });
    return resultResponse(result);
  } catch (error) {
    console.error("Unsubscribe GET failed:", error);
    return jsonError("internal_error", 500);
  }
}

/**
 * One-click target for `List-Unsubscribe-Post`. Mail clients POST with a form
 * body and the token in the query; JSON callers may also ask to re-subscribe.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let token = tokenFromUrl(request);
    let resubscribe = false;

    if (contentType.includes("application/json")) {
      const parsed = unsubscribeActionSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!parsed.success) return jsonError("invalid_body", 400);
      token = parsed.data.token;
      resubscribe = parsed.data.action === "resubscribe";
    }

    const result = await unsubscribeWithToken(token, {
      resubscribe,
      ipPrefix: auditIpPrefix(request),
    });
    return resultResponse(result);
  } catch (error) {
    console.error("Unsubscribe POST failed:", error);
    return jsonError("internal_error", 500);
  }
}

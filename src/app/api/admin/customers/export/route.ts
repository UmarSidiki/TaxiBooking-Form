import { requireAdmin } from "@/features/auth/lib/require-role";
import { buildCustomerExportStream } from "@/features/customers-admin/lib/customer-export/stream-customer-export";
import { queryObjectFromSearchParams } from "@/features/customers-admin/lib/query-object";
import { customerExportQuerySchema } from "@/features/customers-admin/schema/customer-export.schema";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const parsed = customerExportQuerySchema.safeParse(
      queryObjectFromSearchParams(url.searchParams),
    );
    if (!parsed.success) return jsonError("invalid_query", 400);

    const stream = buildCustomerExportStream({
      params: parsed.data,
      actor: access.session.user,
      request,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="customers.csv"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Customer export failed:", error);
    return jsonError("internal_error", 500);
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { listCustomers } from "@/features/customers-admin/lib/customer-list/list-customers";
import { customerListQuerySchema } from "@/features/customers-admin/schema/customer-list.schema";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toQueryObject(searchParams: URLSearchParams): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams) {
    if (value !== "") query[key] = value;
  }
  return query;
}

export async function GET(request: Request) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const parsed = customerListQuerySchema.safeParse(
      toQueryObject(url.searchParams),
    );
    if (!parsed.success) return jsonError("invalid_query", 400);

    const page = await listCustomers(parsed.data);
    if (!page.ok) return jsonError(page.error, 400);

    return NextResponse.json({
      success: true,
      rows: page.rows,
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    console.error("Admin customers list failed:", error);
    return jsonError("internal_error", 500);
  }
}

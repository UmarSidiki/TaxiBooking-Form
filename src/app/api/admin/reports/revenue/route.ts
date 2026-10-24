import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { revenueByMonth, revenueCsv } from "@/features/reports/lib/revenue-report";
import { connectDB } from "@/shared/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  await connectDB();
  const rows = await revenueByMonth();
  return new NextResponse(revenueCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
}

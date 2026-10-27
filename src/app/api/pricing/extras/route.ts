import { NextResponse } from "next/server";
import { loadPricingExtras } from "@/features/pricing/lib/load-pricing-extras";

/** Public: which booking extras are on and what they cost. */
export async function GET() {
  const extras = await loadPricingExtras();
  return NextResponse.json({ extras }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}

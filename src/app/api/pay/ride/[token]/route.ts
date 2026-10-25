import { NextResponse } from "next/server";
import { readRidePayToken } from "@/features/invoices/lib/ride-pay-link";
import { ridePaySummary, startRideCheckout } from "@/features/invoices/lib/start-ride-checkout";
import { jsonError } from "@/shared/http/json-error";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  const tripId = readRidePayToken((await params).token);
  if (!tripId) return jsonError("not_found", 404);
  const summary = await ridePaySummary(tripId);
  if (!summary) return jsonError("not_found", 404);
  return NextResponse.json({ ok: true, ...summary });
}

export async function POST(request: Request, { params }: Params) {
  const tripId = readRidePayToken((await params).token);
  if (!tripId) return jsonError("not_found", 404);
  try {
    const opened = await startRideCheckout(tripId, request);
    if (!opened.ok) return jsonError(opened.error, opened.status);
    return NextResponse.json(opened);
  } catch (error) {
    console.error("Ride checkout failed", error);
    return jsonError("payment_failed", 502);
  }
}

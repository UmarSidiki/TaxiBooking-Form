import { NextResponse } from "next/server";
import { Vehicle } from "@/features/fleet/model";
import { priceServerBooking } from "@/features/pricing/lib/price-server-booking";
import { quoteRequestSchema } from "@/features/pricing/schema/quote-request.schema";
import { fetchRouteDistanceKm } from "@/features/payments/lib/fare/route-distance";
import { loadPaymentSettings } from "@/features/payments/lib/load-payment-settings";
import { connectDB } from "@/shared/db";
import { limitSensitive } from "@/shared/http/sensitive-limit";

export async function POST(request: Request) {
  const limited = await limitSensitive(request, "quote");
  if (limited) return limited;
  const parsed = quoteRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  await connectDB();
  const vehicle = await Vehicle.findById(parsed.data.selectedVehicle);
  if (!vehicle?.isActive) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const distanceKm =
    parsed.data.bookingType === "hourly"
      ? undefined
      : parsed.data.distanceKm ??
        (await fetchRouteDistanceKm({
          pickup: parsed.data.pickup ?? "",
          dropoff: parsed.data.dropoff ?? "",
          stops: parsed.data.stops,
        }));
  const { settings } = await loadPaymentSettings();
  const priced = await priceServerBooking({
    vehicle,
    booking: parsed.data,
    distanceKm,
    tax: settings ?? {},
  });
  if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: 400 });
  return NextResponse.json({
    total: priced.quote.total,
    subtotal: priced.quote.subtotal,
    taxAmount: priced.quote.taxAmount,
    lines: priced.quote.lines,
  });
}

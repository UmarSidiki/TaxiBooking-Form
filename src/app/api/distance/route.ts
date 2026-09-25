import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { distanceRequestSchema } from "@/features/booking/schema/checkout.schema";

export const dynamic = "force-dynamic";

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ${mins} min${mins !== 1 ? "s" : ""}`;
  }
  return `${mins} min${mins !== 1 ? "s" : ""}`;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, distanceRequestSchema);
    if (!parsed.ok) return parsed.response;
    const { origin, destination, stops, isRoundTrip } = parsed.data;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return jsonError("maps_not_configured", 500);
    }

    const validStops = stops.filter((stop) => stop.trim());
    const waypoints =
      validStops.length > 0
        ? `&waypoints=${validStops.map((stop) => `via:${encodeURIComponent(stop)}`).join("|")}`
        : "";

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}${waypoints}&key=${apiKey}&units=metric`;

    const response = await fetch(url);
    const data = (await response.json()) as {
      status: string;
      routes?: Array<{
        legs: Array<{
          distance: { value: number };
          duration: { value: number };
          start_address?: string;
          end_address?: string;
        }>;
      }>;
    };

    if (data.status !== "OK") {
      return jsonError("distance_failed", 400);
    }

    const route = data.routes?.[0];
    if (!route) {
      return jsonError("distance_failed", 400);
    }

    const distanceInMeters = route.legs.reduce(
      (total, leg) => total + leg.distance.value,
      0
    );
    const durationInSeconds = route.legs.reduce(
      (total, leg) => total + leg.duration.value,
      0
    );

    // Deliberately NOT doubled for round trips: round-trip pricing is applied by
    // the fare authority using the vehicle's returnPricePercentage, so doubling
    // the route distance here would double-count it and desync client and server.

    const distanceInKm = distanceInMeters / 1000;
    const durationInMinutes = Math.round(durationInSeconds / 60);

    return NextResponse.json({
      success: true,
      data: {
        distance: {
          value: distanceInMeters,
          text: `${distanceInKm.toFixed(1)} km${isRoundTrip ? " (round trip)" : ""}`,
          km: parseFloat(distanceInKm.toFixed(2)),
        },
        duration: {
          value: durationInSeconds,
          text: formatDuration(durationInMinutes),
          minutes: durationInMinutes,
        },
        origin: route.legs[0]?.start_address,
        destination: route.legs[route.legs.length - 1]?.end_address,
        stops,
      },
    });
  } catch (error) {
    console.error("Distance calculation failed:", error);
    return jsonError("internal_error", 500);
  }
}

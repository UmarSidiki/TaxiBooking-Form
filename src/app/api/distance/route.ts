import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, stops = [], isRoundTrip } = await request.json();

    if (!origin || !destination) {
      return NextResponse.json(
        { success: false, message: "Origin and destination are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Build waypoints string for Directions API
    let waypoints = '';
    if (stops.length > 0) {
      const validStops = stops.filter((stop: string) => stop.trim());
      if (validStops.length > 0) {
        waypoints = `&waypoints=${validStops.map((stop: string) => `via:${encodeURIComponent(stop)}`).join('|')}`;
      }
    }

    // Call Google Maps Directions API
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}${waypoints}&key=${apiKey}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { success: false, message: "Failed to calculate distance" },
        { status: 400 }
      );
    }

    const route = data.routes[0];
    if (!route) {
      return NextResponse.json(
        { success: false, message: "Could not find route between locations" },
        { status: 400 }
      );
    }

    let distanceInMeters = route.legs.reduce((total: number, leg: { distance: { value: number } }) => total + leg.distance.value, 0);
    let distanceInKm = distanceInMeters / 1000;
    let durationInSeconds = route.legs.reduce((total: number, leg: { duration: { value: number } }) => total + leg.duration.value, 0);
    let durationInMinutes = Math.round(durationInSeconds / 60);

    // If it's a round trip, double the distance and time
    if (isRoundTrip) {
      distanceInMeters *= 2;
      distanceInKm *= 2;
      durationInSeconds *= 2;
      durationInMinutes *= 2;
    }

    // Format duration text for round trips
    const formatDuration = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
      }
      return `${mins} min${mins !== 1 ? 's' : ''}`;
    };

    // Format distance text
    const formatDistance = (km: number, isRoundTrip: boolean) => {
      if (isRoundTrip) {
        return `${km.toFixed(1)} km (round trip)`;
      }
      return `${km.toFixed(1)} km`;
    };

    return NextResponse.json({
      success: true,
      data: {
        distance: {
          value: distanceInMeters,
          text: formatDistance(distanceInKm, isRoundTrip),
          km: parseFloat(distanceInKm.toFixed(2)),
        },
        duration: {
          value: durationInSeconds,
          text: isRoundTrip ? formatDuration(durationInMinutes) : formatDuration(durationInMinutes),
          minutes: durationInMinutes,
        },
        origin: route.legs[0]?.start_address,
        destination: route.legs[route.legs.length - 1]?.end_address,
        stops: stops,
      },
    });
  } catch (error) {
    console.error("Distance calculation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Distance calculation failed",
      },
      { status: 500 }
    );
  }
}

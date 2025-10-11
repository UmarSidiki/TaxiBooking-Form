import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, isRoundTrip } = await request.json();

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

    // Call Google Maps Distance Matrix API
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { success: false, message: "Failed to calculate distance" },
        { status: 400 }
      );
    }

    const element = data.rows[0]?.elements[0];

    if (!element || element.status !== "OK") {
      return NextResponse.json(
        { success: false, message: "Could not find route between locations" },
        { status: 400 }
      );
    }

    let distanceInMeters = element.distance.value;
    let distanceInKm = distanceInMeters / 1000;
    let durationInSeconds = element.duration.value;
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

    return NextResponse.json({
      success: true,
      data: {
        distance: {
          value: distanceInMeters,
          text: isRoundTrip ? `${distanceInKm.toFixed(1)} km (round trip)` : element.distance.text,
          km: parseFloat(distanceInKm.toFixed(2)),
        },
        duration: {
          value: durationInSeconds,
          text: isRoundTrip ? formatDuration(durationInMinutes) : element.duration.text,
          minutes: durationInMinutes,
        },
        origin: data.origin_addresses[0],
        destination: data.destination_addresses[0],
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

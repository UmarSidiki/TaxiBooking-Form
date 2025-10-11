import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { origin, destination } = await request.json();

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

    const distanceInMeters = element.distance.value;
    const distanceInKm = distanceInMeters / 1000;
    const durationInSeconds = element.duration.value;
    const durationInMinutes = Math.round(durationInSeconds / 60);

    return NextResponse.json({
      success: true,
      data: {
        distance: {
          value: distanceInMeters,
          text: element.distance.text,
          km: parseFloat(distanceInKm.toFixed(2)),
        },
        duration: {
          value: durationInSeconds,
          text: element.duration.text,
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

import { Booking } from "@/features/booking/model";
import { readRideStatusToken } from "@/features/customers/lib/ride-status-url";
import { connectDB } from "@/shared/db";

export default async function RideStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const parsed = readRideStatusToken(token ?? null);
  if (!parsed) {
    return <main className="mx-auto max-w-md p-6"><h1 className="text-xl font-semibold">Link expired</h1></main>;
  }
  await connectDB();
  const ride = await Booking.findOne({ tripId: parsed.tripId }).select("tripId pickup dropoff date time status driverRideStatus assignedDriver vehicleDetails").lean();
  if (!ride) {
    return <main className="mx-auto max-w-md p-6"><p role="alert">Ride not found.</p></main>;
  }
  const status = ride.driverRideStatus || ride.status || "upcoming";
  return (
    <main className="mx-auto flex max-w-md flex-col gap-3 p-6">
      <h1 className="text-2xl font-semibold">Trip {ride.tripId}</h1>
      <p className="text-sm text-muted-foreground">{ride.pickup} → {ride.dropoff || "Hourly"}</p>
      <p>Status: {status}</p>
      <p>Pickup {ride.date} at {ride.time}. This is the scheduled time, not a live location.</p>
      {ride.assignedDriver?.name ? <p>Driver: {ride.assignedDriver.name}</p> : <p>Driver not assigned yet.</p>}
      {ride.vehicleDetails?.name ? <p>Car: {ride.vehicleDetails.name}</p> : null}
    </main>
  );
}

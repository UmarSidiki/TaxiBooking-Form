import { Booking } from "@/features/booking/model";
import { readRideStatusToken } from "@/features/customers/lib/ride-status-url";
import { connectDB } from "@/shared/db";
import { getTranslations } from "next-intl/server";

export default async function RideStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [t, { token }] = await Promise.all([getTranslations("RideStatus"), searchParams]);
  const parsed = readRideStatusToken(token ?? null);
  if (!parsed) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold">{t("expired-title")}</h1>
      </main>
    );
  }
  await connectDB();
  const ride = await Booking.findOne({ tripId: parsed.tripId }).select("tripId pickup dropoff date time status driverRideStatus assignedDriver vehicleDetails").lean();
  if (!ride) {
    return (
      <main className="mx-auto max-w-md p-6">
        <p role="alert">{t("not-found")}</p>
      </main>
    );
  }
  const status = ride.driverRideStatus || ride.status || "upcoming";
  return (
    <main className="mx-auto flex max-w-md flex-col gap-3 p-6">
      <h1 className="text-2xl font-semibold">{t("title", { tripId: ride.tripId })}</h1>
      <p className="text-sm text-muted-foreground">{ride.pickup} → {ride.dropoff || t("hourly")}</p>
      <p>{t("status", { status })}</p>
      <p>{t("pickup", { date: ride.date, time: ride.time })}</p>
      {ride.assignedDriver?.name ? <p>{t("driver", { name: ride.assignedDriver.name })}</p> : <p>{t("no-driver")}</p>}
      {ride.vehicleDetails?.name ? <p>{t("car", { name: ride.vehicleDetails.name })}</p> : null}
    </main>
  );
}

import RideActivity from "@/features/rides/model/RideActivity";

export async function recordRideActivity(input: {
  bookingId: string;
  actorId: string;
  actorRole: "admin" | "driver" | "partner" | "system";
  action: string;
}) {
  await RideActivity.create(input);
}

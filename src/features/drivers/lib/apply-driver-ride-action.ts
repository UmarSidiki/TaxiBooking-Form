import { Booking } from "@/features/booking/model";
import { recordRideActivity } from "@/features/rides/lib/record-ride-activity";
import type { DriverRideAction } from "@/features/drivers/schema/driver-ride-action.schema";

export async function applyDriverRideAction(
  driverId: string,
  rideId: string,
  action: DriverRideAction,
) {
  const update: Record<string, unknown> = {
    driverRideStatus: action.action,
  };
  if (action.action === "completed") {
    update.status = "completed";
  }
  if (typeof action.cashCollected === "number") {
    update.cashCollected = action.cashCollected;
  }

  const updated = await Booking.findOneAndUpdate(
    {
      _id: rideId,
      "assignedDriver._id": driverId,
      status: { $in: ["upcoming", "completed"] },
    },
    { $set: update },
    { returnDocument: "after" },
  );
  if (updated) {
    await recordRideActivity({
      bookingId: rideId,
      actorId: driverId,
      actorRole: "driver",
      action: action.action,
    });
  }
  return updated;
}

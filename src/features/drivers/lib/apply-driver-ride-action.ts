import { Booking } from "@/features/booking/model";
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

  return Booking.findOneAndUpdate(
    {
      _id: rideId,
      "assignedDriver._id": driverId,
      status: { $in: ["upcoming", "completed"] },
    },
    { $set: update },
    { returnDocument: "after" },
  );
}

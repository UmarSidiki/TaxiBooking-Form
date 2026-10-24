import { Driver } from "@/features/drivers/model";
import { driverTimeOffBlocks } from "@/features/drivers/lib/driver-time-off-block";
import { driverWorks } from "@/features/drivers/lib/driver-approval";
import type { IBooking } from "@/features/booking/model";
import type { BookingPatchApplyResult } from "@/features/booking/lib/booking-patch-result";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";

export async function applyAssignDriver(
  driverId: unknown,
  updateData: Partial<IBooking>,
  vehicleId?: string,
  booking?: {
    date: string;
    time: string;
    bookingType?: string | null;
    duration?: number | null;
    tripType?: string | null;
  },
): Promise<BookingPatchApplyResult> {
  if (!driverId) {
    return {
      ok: false,
      status: 400,
      message: "Driver ID is required for assignment",
    };
  }

  const driver = await Driver.findById(driverId);
  if (!driver) {
    return { ok: false, status: 404, message: "Driver not found" };
  }
  if (!driverWorks(driver.status) || driver.isActive === false) {
    return { ok: false, status: 400, message: "Driver must be approved and active" };
  }
  if (driver.assignedVehicle && vehicleId && String(driver.assignedVehicle) !== String(vehicleId)) {
    return { ok: false, status: 400, message: "Driver is not approved for this vehicle" };
  }
  if (booking && (await driverTimeOffBlocks(String(driver._id), booking))) {
    return { ok: false, status: 409, message: "driver_time_off" };
  }

  updateData.assignedDriver = {
    _id: driver._id.toString(),
    name: driver.name,
    email: driver.email,
  };
  updateData.assignmentEmailSent = false;
  updateData.availableForPartners = false;
  updateData.responsibleAssignee = "driver";

  const { dispatchAssigneeMode } = await getPartnerDispatchSettings();
  const unsetFields: string[] = ["partnerAcceptanceDeadline"];

  if (dispatchAssigneeMode === "exclusive") {
    unsetFields.push("assignedPartner");
  }

  return { ok: true, updateData, unsetFields };
}

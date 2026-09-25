import { Driver } from "@/features/drivers/model";
import type { IBooking } from "@/features/booking/model";
import type { BookingPatchApplyResult } from "@/features/booking/lib/booking-patch-result";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";

export async function applyAssignDriver(
  driverId: unknown,
  updateData: Partial<IBooking>
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

  updateData.assignedDriver = {
    _id: driver._id.toString(),
    name: driver.name,
    email: driver.email,
  };
  updateData.assignmentEmailSent = false;
  updateData.availableForPartners = false;

  const { dispatchAssigneeMode } = await getPartnerDispatchSettings();
  const unsetFields: string[] = ["partnerAcceptanceDeadline"];

  if (dispatchAssigneeMode === "exclusive") {
    unsetFields.push("assignedPartner");
  }

  return { ok: true, updateData, unsetFields };
}

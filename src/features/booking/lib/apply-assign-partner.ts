import { Partner } from "@/features/partners/model";
import type { IBooking } from "@/features/booking/model";
import type { BookingPatchApplyResult } from "@/features/booking/lib/booking-patch-result";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";
import { partnerCanTakeRide } from "@/features/partners/lib/partner-access";

export async function applyAssignPartner(
  booking: IBooking,
  bookingId: string,
  partnerId: unknown,
  updateData: Partial<IBooking>
): Promise<BookingPatchApplyResult> {
  if (!partnerId) {
    return {
      ok: false,
      status: 400,
      message: "Partner ID is required for assignment",
    };
  }

  const partner = await Partner.findById(partnerId);
  if (!partner) {
    return { ok: false, status: 404, message: "Partner not found" };
  }

  if (!partnerCanTakeRide(partner, String(booking.selectedVehicle ?? ""))) {
    return {
      ok: false,
      status: 400,
      message: "Partner must be active and approved for this vehicle",
    };
  }

  if (booking.partnerReviewStatus !== "approved") {
    console.log("Partner review not approved for booking:", bookingId);
    return {
      ok: false,
      status: 400,
      message:
        "Booking must be approved for partners before assignment. Please approve first or try again.",
    };
  }

  updateData.assignedPartner = {
    _id: partner._id.toString(),
    name: partner.name,
    email: partner.email,
  };
  updateData.assignmentEmailSent = false;
  updateData.availableForPartners = false;
  updateData.responsibleAssignee = "partner";

  const { dispatchAssigneeMode } = await getPartnerDispatchSettings();
  const unsetFields: string[] = ["partnerAcceptanceDeadline"];

  if (dispatchAssigneeMode === "exclusive") {
    unsetFields.push("assignedDriver");
  }

  return { ok: true, updateData, unsetFields };
}

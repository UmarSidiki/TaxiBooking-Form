import type { IPartner } from "@/features/partners/model/Partner";
import { approvedVehicleIds } from "@/features/partners/lib/partner-access";

/** Vehicle IDs the partner may claim overflow for. */
export function partnerApprovedVehicleIds(partner: Pick<IPartner, "fleetRequests" | "currentFleet" | "fleetStatus" | "requestedFleet" | "vehicles">) {
  return approvedVehicleIds(partner);
}

export function partnerHasApprovedFleet(
  partner: Pick<
    IPartner,
    "fleetRequests" | "currentFleet" | "fleetStatus" | "requestedFleet"
  >
): boolean {
  return partnerApprovedVehicleIds(partner).length > 0;
}

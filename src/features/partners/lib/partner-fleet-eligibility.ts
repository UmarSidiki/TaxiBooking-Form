import type { IPartner } from "@/features/partners/model/Partner";

/** Vehicle IDs the partner may claim overflow for. */
export function partnerApprovedVehicleIds(
  partner: Pick<
    IPartner,
    | "fleetRequests"
    | "currentFleet"
    | "fleetStatus"
    | "requestedFleet"
  >
): string[] {
  const ids = new Set<string>();

  for (const req of partner.fleetRequests ?? []) {
    if (req.status === "approved" && req.vehicleId) {
      ids.add(String(req.vehicleId));
    }
  }

  if (partner.currentFleet) {
    ids.add(String(partner.currentFleet));
  }

  if (partner.fleetStatus === "approved" && partner.requestedFleet) {
    ids.add(String(partner.requestedFleet));
  }

  return [...ids];
}

export function partnerHasApprovedFleet(
  partner: Pick<
    IPartner,
    "fleetRequests" | "currentFleet" | "fleetStatus" | "requestedFleet"
  >
): boolean {
  return partnerApprovedVehicleIds(partner).length > 0;
}

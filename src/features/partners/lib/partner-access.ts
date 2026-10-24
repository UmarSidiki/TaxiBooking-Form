type AccessPartner = {
  status?: string | null;
  isActive?: boolean | null;
  vehicles?: Array<{ vehicleId?: unknown; status?: string | null }> | null;
  fleetRequests?: Array<{ vehicleId?: unknown; status?: string | null }> | null;
  currentFleet?: unknown;
  fleetStatus?: string | null;
  requestedFleet?: unknown;
};

/** Pending, active, suspended, or rejected. `approved` remains readable until migration. */
export function partnerMayWork(partner: AccessPartner | null | undefined) {
  if (!partner) return false;
  if (partner.status === "active") return true;
  if (partner.status === "approved") return partner.isActive !== false;
  return false;
}

export function approvedVehicleIds(partner: AccessPartner | null | undefined) {
  const ids = new Set<string>();
  if (!partner) return [];

  for (const vehicle of partner.vehicles ?? []) {
    if (vehicle.status === "approved" && vehicle.vehicleId) ids.add(String(vehicle.vehicleId));
  }
  for (const request of partner.fleetRequests ?? []) {
    if (request.status === "approved" && request.vehicleId) ids.add(String(request.vehicleId));
  }
  if (partner.currentFleet) ids.add(String(partner.currentFleet));
  if (partner.fleetStatus === "approved" && partner.requestedFleet) {
    ids.add(String(partner.requestedFleet));
  }
  return [...ids];
}

export function partnerCanTakeRide(
  partner: AccessPartner | null | undefined,
  vehicleId: string,
) {
  return partnerMayWork(partner) && approvedVehicleIds(partner).includes(String(vehicleId));
}

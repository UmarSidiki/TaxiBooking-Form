export type PartnerFleetRequestStatus = "none" | "pending" | "approved" | "rejected";

export type PartnerFleetRequest = {
  vehicleId: string;
  status: PartnerFleetRequestStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
};

export type PartnerFleetData = {
  _id: string;
  name: string;
  email: string;
  fleetRequests?: PartnerFleetRequest[];
  currentFleet?: string;
  // Keep backward compatibility
  requestedFleet?: string;
  fleetStatus?: PartnerFleetRequestStatus;
  fleetRequestedAt?: string;
  fleetRejectionReason?: string;
};

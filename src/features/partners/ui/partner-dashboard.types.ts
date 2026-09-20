export interface PartnerDashboardProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  rejectionReason?: string;
}

export interface PartnerRideStats {
  totalRides: number;
  upcomingRides: number;
  completedRides: number;
  canceledRides: number;
  totalEarnings: number;
}

export interface PartnerAvailableRide {
  _id: string;
  tripId: string;
  pickup: string;
  dropoff?: string;
  date: string;
  time: string;
  passengers: number;
  vehicleDetails: {
    name: string;
  };
  totalAmount: number;
  partnerPayoutAmount?: number;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PartnerDashboardFleetInfo {
  fleetStatus: "none" | "pending" | "approved" | "rejected";
}

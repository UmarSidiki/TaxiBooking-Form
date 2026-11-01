export interface PartnerDashboardProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: "pending" | "active" | "approved" | "rejected" | "suspended";
  rejectionReason?: string;
}

export interface PartnerRideStats {
  totalRides: number;
  upcomingRides: number;
  completedRides: number;
  canceledRides: number;
  totalEarnings: number;
  balance?: number;
}

export interface PartnerAvailableRide {
  _id: string;
  tripId: string;
  pickup: string;
  pickupLatLng?: { lat: number; lng: number } | null;
  dropoff?: string;
  dropoffLatLng?: { lat: number; lng: number } | null;
  stops?: Array<{ location: string; order: number; latLng?: { lat: number; lng: number } | null }>;
  bookingType?: string;
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
}

export interface PartnerDashboardFleetInfo {
  fleetStatus: "none" | "pending" | "approved" | "rejected";
}

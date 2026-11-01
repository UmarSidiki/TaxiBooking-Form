export interface PartnerRideBooking {
  _id: string;
  tripId: string;
  pickup: string;
  pickupLatLng?: { lat: number; lng: number } | null;
  dropoff: string;
  dropoffLatLng?: { lat: number; lng: number } | null;
  stops?: Array<{ location: string; order: number; duration?: number; latLng?: { lat: number; lng: number } | null }>;
  bookingType?: string;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  tripType: string;
  passengers: number;
  childSeats: number;
  babySeats: number;
  flightNumber?: string;
  notes?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleDetails: {
    name: string;
    price: string;
    seats: string;
  };
  selectedVehicle?: string;
  totalAmount: number;
  partnerPayoutAmount?: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  refundAmount?: number;
  refundPercentage?: number;
  canceledAt?: string;
}

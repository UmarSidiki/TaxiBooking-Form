export type Ride = {
  _id?: string;
  tripId: string;
  pickup: string;
  dropoff?: string;
  date: string;
  time: string;
  status?: string;
  totalAmount?: number;
  passengers?: number;
  childSeats?: number;
  babySeats?: number;
  meetAndGreet?: boolean;
  bookingType?: string;
  duration?: number;
  vehicleDetails?: { name?: string; price?: string; seats?: string };
  assignedDriver?: { _id?: string; name?: string; email?: string };
  assignedPartner?: { _id?: string; name?: string; email?: string };
  driverRideStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  locale?: string;
  whatsappOptIn?: boolean;
};

export type CustomerProfile = {
  name?: string;
  phone?: string;
  whatsappOptIn?: boolean;
  savedAddresses?: { home?: string; work?: string; airport?: string };
  language?: string;
};
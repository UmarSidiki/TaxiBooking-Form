import { ObjectId } from "mongodb";

export interface Booking {
  _id?: ObjectId;
  tripId: string;
  pickup: string;
  dropoff?: string;
  tripType: "oneway" | "roundtrip";
  date: string;
  time: string;
  passengers: number;
  selectedVehicle: string;
  vehicleDetails?: {
    name: string;
    price: string;
    seats: string;
  };
  childSeats: number;
  babySeats: number;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  paymentMethod?: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  status?: "upcoming" | "completed" | "canceled";
  totalAmount?: number;
  refundAmount?: number;
  refundPercentage?: number;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingInput {
  bookingType?: "destination" | "hourly";
  pickup: string;
  dropoff?: string;
  tripType: "oneway" | "roundtrip";
  duration?: number;
  date: string;
  time: string;
  passengers: number;
  selectedVehicle: string;
  childSeats: number;
  babySeats: number;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  stripePaymentIntentId?: string;
  totalAmount?: number;
}

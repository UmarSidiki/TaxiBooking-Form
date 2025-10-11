import { ObjectId } from "mongodb";

export interface Booking {
  _id?: ObjectId;
  tripId: string;
  pickup: string;
  dropoff: string;
  tripType: "oneway" | "return";
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
  paymentStatus: "pending" | "completed" | "failed";
  totalAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingInput {
  pickup: string;
  dropoff: string;
  tripType: "oneway" | "return";
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
  cardNumber: string;
  expiry: string;
  cvv: string;
}

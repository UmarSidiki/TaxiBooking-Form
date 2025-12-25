import { Schema, model, models } from "mongoose";

export interface IPendingBooking {
  _id?: string;
  orderId: string;
  bookingData: {
    pickup: string;
    dropoff?: string;
    stops?: Array<{
      location: string;
      order: number;
      duration?: number;
    }>;
    tripType: "oneway" | "roundtrip";
    bookingType?: "destination" | "hourly";
    duration?: number;
    date: string;
    time: string;
    returnDate?: string;
    returnTime?: string;
    passengers: number;
    selectedVehicle: string;
    childSeats: number;
    babySeats: number;
    notes: string;
    flightNumber?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    totalAmount: number;
    subtotalAmount?: number;
    taxAmount?: number;
    taxPercentage?: number;
  };
  paymentMethod: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PendingBookingSchema = new Schema<IPendingBooking>(
  {
    orderId: { type: String, required: true, unique: true },
    bookingData: {
      type: Object,
      required: true,
    },
    paymentMethod: { type: String, required: true },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '5m' }, // TTL index - MongoDB will auto-delete expired documents
    },
  },
  {
    timestamps: true,
  }
);

const PendingBooking =
  models.PendingBooking ||
  model<IPendingBooking>("PendingBooking", PendingBookingSchema);

export default PendingBooking;

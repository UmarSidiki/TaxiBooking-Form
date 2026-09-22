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
    whatsappOptIn?: boolean;
    locale?: string;
    totalAmount: number;
    subtotalAmount?: number;
    taxAmount?: number;
    taxPercentage?: number;
  };
  paymentMethod: string;
  paymentIntentId?: string;
  expectedAmount?: number;
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
    paymentIntentId: { type: String, index: true },
    expectedAmount: { type: Number },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Delete when expiresAt is reached (30 min checkout window)
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

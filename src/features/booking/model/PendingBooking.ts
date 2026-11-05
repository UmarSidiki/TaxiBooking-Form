import { Schema, model, models } from "mongoose";

export type PendingBookingStatus = "open" | "paid" | "abandoned";

export type PendingBookingPurpose = "booking" | "cash_deposit" | "appointment_deposit";

export interface IPendingBooking {
  _id?: string;
  orderId: string;
  /** Client-generated checkout draft id. One open draft per browser booking. */
  draftId?: string;
  bookingData: {
    pickup: string;
    pickupLatLng?: { lat: number; lng: number } | null;
    dropoff?: string;
    dropoffLatLng?: { lat: number; lng: number } | null;
    stops?: Array<{
      location: string;
      latLng?: { lat: number; lng: number } | null;
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
    depositDue?: number;
    balanceDue?: number;
    fareLines?: { code: string; amount: number }[];
    promoCode?: string;
    meetAndGreet?: boolean;
  };
  paymentMethod: string;
  purpose?: PendingBookingPurpose;
  stripePaymentIntentId?: string;
  status: PendingBookingStatus;
  expectedAmount?: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PendingBookingSchema = new Schema<IPendingBooking>(
  {
    orderId: { type: String, required: true, unique: true },
    draftId: { type: String, unique: true, sparse: true },
    bookingData: {
      type: Object,
      required: true,
    },
    paymentMethod: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["booking", "cash_deposit", "appointment_deposit"],
      default: "booking",
    },
    stripePaymentIntentId: { type: String, index: true },
    status: {
      type: String,
      enum: ["open", "paid", "abandoned"],
      default: "open",
      index: true,
    },
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

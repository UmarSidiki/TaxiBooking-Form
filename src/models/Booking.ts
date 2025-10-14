import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
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

const BookingSchema: Schema = new Schema({
  tripId: { type: String, required: true, unique: true },
  pickup: { type: String, required: true },
  dropoff: { type: String },
  tripType: { type: String, enum: ["oneway", "roundtrip"], required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  passengers: { type: Number, required: true },
  selectedVehicle: { type: String, required: true },
  vehicleDetails: {
    name: { type: String },
    price: { type: String },
    seats: { type: String },
  },
  childSeats: { type: Number, default: 0 },
  babySeats: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  paymentMethod: { type: String, default: "stripe" },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  stripePaymentIntentId: { type: String },
  status: {
    type: String,
    enum: ["upcoming", "completed", "canceled"],
    default: "upcoming"
  },
  totalAmount: { type: Number },
  refundAmount: { type: Number },
  refundPercentage: { type: Number },
  canceledAt: { type: Date },
}, {
  timestamps: true,
});

// Create indexes for better performance
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ tripId: 1 });

const Booking = mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;

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

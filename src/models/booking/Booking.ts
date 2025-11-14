import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  tripId: string;
  pickup: string;
  dropoff?: string;
  stops?: Array<{
    location: string;
    order: number;
    duration?: number;
  }>;
  tripType: "oneway" | "roundtrip";
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
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
  flightNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  paymentMethod?: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  multisafepayOrderId?: string;
  multisafepayTransactionId?: string;
  status?: "upcoming" | "completed" | "canceled";
  totalAmount?: number;
  refundAmount?: number;
  refundPercentage?: number;
  canceledAt?: Date;
  thankYouEmailSent?: boolean;
  reviewSubmitted?: boolean;
  assignedDriver?: {
    _id: string;
    name: string;
    email: string;
  };
  assignedPartner?: {
    _id: string;
    name: string;
    email: string;
  };
  assignmentEmailSent?: boolean;
  // Partner notification fields
  partnerNotificationSent?: boolean;
  eligiblePartnersCount?: number;
  availableForPartners?: boolean; // Track if ride is still available for partner acceptance
  partnerAcceptanceDeadline?: Date; // Optional deadline for partner acceptance
  partnerReviewStatus?: "pending" | "approved" | "rejected";
  partnerMarginPercentage?: number;
  partnerMarginAmount?: number;
  partnerPayoutAmount?: number;
  partnerApprovedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema({
  tripId: { type: String, required: true, unique: true },
  pickup: { type: String, required: true },
  dropoff: { type: String },
  stops: [{
    location: { type: String, required: true },
    order: { type: Number, required: true },
    duration: { type: Number, default: 0 }
  }],
  tripType: { type: String, enum: ["oneway", "roundtrip"], required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  returnDate: { type: String },
  returnTime: { type: String },
  passengers: { type: Number, required: true },
  selectedVehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
  vehicleDetails: {
    name: { type: String },
    price: { type: String },
    seats: { type: String },
  },
  childSeats: { type: Number, default: 0 },
  babySeats: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  flightNumber: { type: String },
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
  multisafepayOrderId: { type: String },
  multisafepayTransactionId: { type: String },
  status: {
    type: String,
    enum: ["upcoming", "completed", "canceled"],
    default: "upcoming"
  },
  totalAmount: { type: Number },
  refundAmount: { type: Number },
  refundPercentage: { type: Number },
  canceledAt: { type: Date },
  thankYouEmailSent: { type: Boolean, default: false },
  reviewSubmitted: { type: Boolean, default: false },
  assignedDriver: {
    _id: { type: Schema.Types.ObjectId, ref: "Driver" },
    name: { type: String },
    email: { type: String },
  },
  assignedPartner: {
    _id: { type: Schema.Types.ObjectId, ref: "Partner" },
    name: { type: String },
    email: { type: String },
  },
  assignmentEmailSent: { type: Boolean, default: false },
  // Partner notification fields
  partnerNotificationSent: { type: Boolean, default: false },
  eligiblePartnersCount: { type: Number, default: 0 },
  availableForPartners: { type: Boolean, default: false },
  partnerAcceptanceDeadline: { type: Date },
  partnerReviewStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
  },
  partnerMarginPercentage: { type: Number },
  partnerMarginAmount: { type: Number },
  partnerPayoutAmount: { type: Number },
  partnerApprovedAt: { type: Date },
}, {
  timestamps: true,
});

// Create indexes for better performance
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ status: 1 });
// Note: tripId index is already created by unique: true in schema definition

const Booking = mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;

export interface BookingInput {
  bookingType?: "destination" | "hourly";
  pickup: string;
  dropoff?: string;
  stops?: Array<{
    location: string;
    order: number;
    duration?: number;
  }>;
  tripType: "oneway" | "roundtrip";
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
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  stripePaymentIntentId?: string;
  multisafepayOrderId?: string;
  multisafepayTransactionId?: string;
  totalAmount?: number;
}

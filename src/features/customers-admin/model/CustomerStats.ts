import mongoose, { Schema, Document } from "mongoose";

/**
 * Materialised customer read model, one row per lowercased email.
 * Rebuilt nightly from Booking and refreshed incrementally when a ride changes.
 * This deployment is single-tenant: every row belongs to the operator's own data.
 */
export interface ICustomerStats extends Document {
  emailLower: string;
  name: string;
  phoneDigits: string;
  verifiedPhone: string;
  rideCount: number;
  completedCount: number;
  totalSpendMinor: number;
  currency: string;
  firstRideAt: Date | null;
  lastRideAt: Date | null;
  hasUpcoming: boolean;
  locale: string;
  /** Last full-rebuild pass that produced this row; used to prune stale rows. */
  rebuiltAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerStatsSchema = new Schema(
  {
    emailLower: { type: String, required: true },
    name: { type: String, default: "" },
    phoneDigits: { type: String, default: "" },
    verifiedPhone: { type: String, default: "" },
    rideCount: { type: Number, default: 0 },
    completedCount: { type: Number, default: 0 },
    totalSpendMinor: { type: Number, default: 0 },
    currency: { type: String, default: "EUR" },
    firstRideAt: { type: Date, default: null },
    lastRideAt: { type: Date, default: null },
    hasUpcoming: { type: Boolean, default: false },
    locale: { type: String, default: "en" },
    rebuiltAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

CustomerStatsSchema.index({ emailLower: 1 }, { unique: true });
CustomerStatsSchema.index({ lastRideAt: -1 });
CustomerStatsSchema.index({ totalSpendMinor: -1 });
CustomerStatsSchema.index({ rideCount: -1 });
CustomerStatsSchema.index({ phoneDigits: 1 });

const CustomerStats =
  mongoose.models.CustomerStats ||
  mongoose.model<ICustomerStats>("CustomerStats", CustomerStatsSchema);

export default CustomerStats;

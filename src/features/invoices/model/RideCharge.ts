import mongoose, { Schema } from "mongoose";

const RideChargeSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    tripId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    purpose: { type: String, enum: ["deposit", "balance", "full"], required: true },
    provider: { type: String, enum: ["stripe", "multisafepay"], required: true },
    paymentIntentId: { type: String, index: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
  },
  { timestamps: true },
);

const RideCharge = mongoose.models.RideCharge || mongoose.model("RideCharge", RideChargeSchema);

export default RideCharge;

import mongoose, { Schema } from "mongoose";

const CustomerLoginTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    emailLower: { type: String, required: true, index: true },
    purpose: { type: String, required: true, enum: ["login"], default: "login" },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: false },
);

CustomerLoginTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CustomerLoginToken =
  mongoose.models.CustomerLoginToken ||
  mongoose.model("CustomerLoginToken", CustomerLoginTokenSchema);

export default CustomerLoginToken;

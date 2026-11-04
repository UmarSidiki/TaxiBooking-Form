import mongoose, { Schema } from "mongoose";

const CustomerPhoneOtpSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, default: Date.now },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: false },
);

CustomerPhoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CustomerPhoneOtp =
  mongoose.models.CustomerPhoneOtp || mongoose.model("CustomerPhoneOtp", CustomerPhoneOtpSchema);

export default CustomerPhoneOtp;

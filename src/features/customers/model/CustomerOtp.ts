import mongoose, { Schema } from "mongoose";

const CustomerOtpSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    phone: { type: String, default: "" },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

CustomerOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CustomerOtp = mongoose.models.CustomerOtp || mongoose.model("CustomerOtp", CustomerOtpSchema);

export default CustomerOtp;

import mongoose, { Schema } from "mongoose";

const CustomerProfileSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    verifiedPhone: { type: String, default: "" },
    verifiedPhoneAt: { type: Date, default: null },
    whatsappOptIn: { type: Boolean, default: false },
    /**
     * Marketing consent cache. Events live in MarketingConsent; this field is
     * only the latest state per channel. Default "none": past customers are
     * not consented and consent is never inferred from a booking.
     */
    marketing: {
      email: {
        status: { type: String, enum: ["none", "granted", "withdrawn"], default: "none" },
        at: { type: Date, default: null },
        source: { type: String, default: "" },
        textVersion: { type: String, default: "" },
      },
      whatsapp: {
        status: { type: String, enum: ["none", "granted", "withdrawn"], default: "none" },
        at: { type: Date, default: null },
        source: { type: String, default: "" },
        textVersion: { type: String, default: "" },
      },
    },
    savedAddresses: {
      home: { type: String, default: "" },
      work: { type: String, default: "" },
      airport: { type: String, default: "" },
    },
    language: { type: String, default: "en" },
  },
  { timestamps: true },
);

const CustomerProfile =
  mongoose.models.CustomerProfile || mongoose.model("CustomerProfile", CustomerProfileSchema);

export default CustomerProfile;
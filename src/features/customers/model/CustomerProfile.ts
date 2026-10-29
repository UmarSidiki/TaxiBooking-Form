import mongoose, { Schema } from "mongoose";

const CustomerProfileSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsappOptIn: { type: Boolean, default: false },
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
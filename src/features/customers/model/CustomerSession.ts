import mongoose, { Schema } from "mongoose";

const CustomerSessionSchema = new Schema(
  {
    idHash: { type: String, required: true, unique: true, index: true },
    emailLower: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    uaFamily: { type: String, default: "" },
    ipPrefix: { type: String, default: "" },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: false },
);

CustomerSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CustomerSession =
  mongoose.models.CustomerSession || mongoose.model("CustomerSession", CustomerSessionSchema);

export default CustomerSession;

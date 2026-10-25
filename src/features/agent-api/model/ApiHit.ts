import mongoose, { Schema } from "mongoose";

const ApiHitSchema = new Schema(
  {
    keyId: { type: String, required: true },
    window: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: false },
);

ApiHitSchema.index({ keyId: 1, window: 1 }, { unique: true });
ApiHitSchema.index({ window: 1 }, { expireAfterSeconds: 120 });

const ApiHit = mongoose.models.ApiHit || mongoose.model("ApiHit", ApiHitSchema);

export default ApiHit;

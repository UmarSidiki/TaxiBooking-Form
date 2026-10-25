import mongoose, { Schema } from "mongoose";

const ApiKeySchema = new Schema(
  {
    name: { type: String, required: true },
    prefix: { type: String, required: true },
    hash: { type: String, required: true, unique: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const ApiKey = mongoose.models.ApiKey || mongoose.model("ApiKey", ApiKeySchema);

export default ApiKey;

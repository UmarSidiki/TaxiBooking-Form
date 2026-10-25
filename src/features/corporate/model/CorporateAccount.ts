import mongoose, { Schema } from "mongoose";

const CorporateAccountSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    billingEmail: { type: String, required: true, trim: true, lowercase: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const CorporateAccount =
  mongoose.models.CorporateAccount || mongoose.model("CorporateAccount", CorporateAccountSchema);

export default CorporateAccount;

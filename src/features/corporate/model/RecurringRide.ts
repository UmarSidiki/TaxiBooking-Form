import mongoose, { Schema } from "mongoose";

const RecurringRideSchema = new Schema(
  {
    pickup: { type: String, required: true },
    dropoff: { type: String, default: "" },
    bookingType: { type: String, enum: ["destination", "hourly"], default: "destination" },
    duration: { type: Number },
    time: { type: String, required: true },
    weekdays: { type: [Number], default: [] },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    email: { type: String, required: true },
    firstName: { type: String, default: "Account" },
    lastName: { type: String, default: "Rider" },
    phone: { type: String, default: "" },
    corporateAccountId: { type: Schema.Types.ObjectId, ref: "CorporateAccount" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const RecurringRide =
  mongoose.models.RecurringRide || mongoose.model("RecurringRide", RecurringRideSchema);

export default RecurringRide;

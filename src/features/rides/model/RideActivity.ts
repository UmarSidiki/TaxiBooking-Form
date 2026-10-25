import { Schema, model, models } from "mongoose";

const RideActivitySchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    actorId: { type: String, required: true },
    actorRole: { type: String, enum: ["admin", "driver", "partner", "system"], required: true },
    action: { type: String, required: true, maxlength: 80 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const RideActivity = models.RideActivity || model("RideActivity", RideActivitySchema);
export default RideActivity;

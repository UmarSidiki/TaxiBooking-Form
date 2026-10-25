import { Schema, model, models, Types } from "mongoose";

const DriverTimeOffSchema = new Schema(
  {
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", required: true, index: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    note: { type: String, maxlength: 300 },
  },
  { timestamps: true },
);

export type DriverTimeOffDoc = {
  _id: Types.ObjectId;
  driverId: Types.ObjectId;
  startsAt: Date;
  endsAt: Date;
  note?: string;
};

const DriverTimeOff =
  models.DriverTimeOff || model("DriverTimeOff", DriverTimeOffSchema);

export default DriverTimeOff;

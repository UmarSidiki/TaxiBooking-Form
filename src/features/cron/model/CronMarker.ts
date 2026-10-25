import mongoose, { Schema } from "mongoose";

export interface ICronMarker {
  key: string;
  lockedUntil?: Date;
  lastRunOn?: string;
}

const CronMarkerSchema = new Schema<ICronMarker>(
  {
    key: { type: String, required: true, unique: true },
    lockedUntil: { type: Date },
    lastRunOn: { type: String },
  },
  { timestamps: false },
);

const CronMarker =
  mongoose.models.CronMarker || mongoose.model<ICronMarker>("CronMarker", CronMarkerSchema);

export default CronMarker;

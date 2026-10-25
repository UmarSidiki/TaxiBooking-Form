import mongoose, { Schema } from "mongoose";

export interface IZonePrice {
  fromLabel: string;
  toLabel: string;
  price: number;
}

const ZonePriceSchema = new Schema<IZonePrice>(
  {
    fromLabel: { type: String, required: true, trim: true },
    toLabel: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

ZonePriceSchema.index({ fromLabel: 1, toLabel: 1 }, { unique: true });

const ZonePrice = mongoose.models.ZonePrice || mongoose.model<IZonePrice>("ZonePrice", ZonePriceSchema);

export default ZonePrice;

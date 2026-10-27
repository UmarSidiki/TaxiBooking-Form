import mongoose, { Schema } from "mongoose";
import type { RoutePlace } from "@/features/pricing/lib/fixed-routes";

export interface IFixedRoute {
  from: RoutePlace[];
  to: RoutePlace[];
  price: number;
  bothWays: boolean;
  /** Set by the v2 migration when an old label could not be geocoded. */
  needsReview?: boolean;
}

const PlaceSchema = new Schema<RoutePlace>(
  {
    label: { type: String, required: true, trim: true },
    placeId: { type: String },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    radiusKm: { type: Number, required: true, min: 0.1, max: 50, default: 2 },
  },
  { _id: false },
);

const FixedRouteSchema = new Schema<IFixedRoute>(
  {
    from: { type: [PlaceSchema], default: [] },
    to: { type: [PlaceSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    bothWays: { type: Boolean, default: false },
    needsReview: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const FixedRoute =
  mongoose.models.FixedRoute || mongoose.model<IFixedRoute>("FixedRoute", FixedRouteSchema);

export default FixedRoute;

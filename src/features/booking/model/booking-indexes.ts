import type { Schema } from "mongoose";

/** Indexes for the queries the desk, driver portal, and overflow marketplace actually run. */
export function registerBookingIndexes(schema: Schema) {
  schema.index({ createdAt: -1 });
  schema.index({ status: 1, date: 1 });
  schema.index({ "assignedDriver._id": 1, status: 1, date: 1, time: 1 });
  schema.index({ "assignedPartner._id": 1, date: 1, time: 1 });
  schema.index(
    {
      status: 1,
      partnerReviewStatus: 1,
      selectedVehicle: 1,
      partnerAcceptanceDeadline: 1,
    },
    { partialFilterExpression: { availableForPartners: true } },
  );
}

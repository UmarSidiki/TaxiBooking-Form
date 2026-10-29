import mongoose, { Schema, model, models } from "mongoose";

export interface IRefundRequest {
  _id?: string;
  bookingId: any;
  tripId?: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  stripeRefundId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const RefundRequestSchema = new Schema<IRefundRequest>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    tripId: { type: String },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "refunded"],
      default: "pending",
    },
    stripeRefundId: { type: String },
  },
  { timestamps: true }
);

const RefundRequest = models.RefundRequest || model<IRefundRequest>("RefundRequest", RefundRequestSchema);
export default RefundRequest;
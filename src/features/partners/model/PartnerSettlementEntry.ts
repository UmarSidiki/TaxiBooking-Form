import { Schema, model, models, Types } from "mongoose";

export type PartnerSettlementType =
  | "payout_credit"
  | "payout_paid"
  | "remittance_credit"
  | "remittance_received"
  | "clawback";

export type PartnerSettlementChannel = "cash" | "online";

export interface IPartnerSettlementEntry {
  _id?: string;
  partnerId: Types.ObjectId | string;
  bookingId?: Types.ObjectId | string;
  type: PartnerSettlementType;
  /** For payout_credit / clawback of share — cash vs online counters. */
  channel?: PartnerSettlementChannel;
  amount: number;
  currency: string;
  note?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PartnerSettlementEntrySchema = new Schema<IPartnerSettlementEntry>(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },
    type: {
      type: String,
      enum: [
        "payout_credit",
        "payout_paid",
        "remittance_credit",
        "remittance_received",
        "clawback",
      ],
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["cash", "online"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "eur",
    },
    note: {
      type: String,
      maxlength: 500,
    },
    createdBy: {
      type: String,
    },
  },
  { timestamps: true }
);

// One credit of each type per booking (idempotent complete / remittance)
PartnerSettlementEntrySchema.index(
  { partnerId: 1, bookingId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: { $in: ["payout_credit", "remittance_credit"] },
      bookingId: { $exists: true },
    },
  }
);

const PartnerSettlementEntry =
  models.PartnerSettlementEntry ||
  model<IPartnerSettlementEntry>(
    "PartnerSettlementEntry",
    PartnerSettlementEntrySchema
  );

export default PartnerSettlementEntry;

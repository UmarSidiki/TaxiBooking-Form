import { Schema, model, models, Types } from "mongoose";

export type PartnerSettlementType =
  | "payout_credit"
  | "payout_paid"
  | "remittance_credit"
  | "remittance_received"
  | "clawback"
  | "ride_credit"
  | "settlement"
  | "opening_balance";

export type SettlementMethod = "cash" | "bank" | "other";

export type PartnerSettlementChannel = "cash" | "online";

export interface IPartnerSettlementEntry {
  _id?: string;
  partnerId: Types.ObjectId | string;
  bookingId?: Types.ObjectId | string;
  type: PartnerSettlementType;
  /** For payout_credit / clawback of share — cash vs online counters. */
  channel?: PartnerSettlementChannel;
  amount: number;
  /** Signed. Positive: operator owes the partner. Negative: partner owes the operator. */
  balanceDelta?: number;
  currency: string;
  method?: SettlementMethod;
  reference?: string;
  note?: string;
  createdBy?: string;
  reversesEntryId?: string;
  fare?: number;
  margin?: number;
  partnerShare?: number;
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
        "ride_credit",
        "settlement",
        "opening_balance",
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
    balanceDelta: { type: Number },
    currency: {
      type: String,
      required: true,
      default: "eur",
    },
    method: { type: String, enum: ["cash", "bank", "other"] },
    reference: { type: String, maxlength: 120 },
    note: {
      type: String,
      maxlength: 500,
    },
    createdBy: {
      type: String,
    },
    reversesEntryId: { type: Schema.Types.ObjectId },
    fare: { type: Number },
    margin: { type: Number },
    partnerShare: { type: Number },
  },
  { timestamps: true }
);

// One credit of each type per booking (idempotent complete / remittance)
PartnerSettlementEntrySchema.index(
  { partnerId: 1, bookingId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: { $in: ["payout_credit", "remittance_credit", "ride_credit"] },
      bookingId: { $exists: true },
    },
  }
);

PartnerSettlementEntrySchema.index(
  { partnerId: 1, type: 1 },
  {
    unique: true,
    name: "partner_opening_balance",
    partialFilterExpression: { type: "opening_balance" },
  }
);

PartnerSettlementEntrySchema.index(
  { reversesEntryId: 1 },
  {
    unique: true,
    partialFilterExpression: { reversesEntryId: { $type: "objectId" } },
  }
);

const PartnerSettlementEntry =
  models.PartnerSettlementEntry ||
  model<IPartnerSettlementEntry>(
    "PartnerSettlementEntry",
    PartnerSettlementEntrySchema
  );

export default PartnerSettlementEntry;

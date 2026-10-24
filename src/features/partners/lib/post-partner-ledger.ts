import mongoose from "mongoose";
import { connectDB } from "@/shared/db/mongoose";
import { isDuplicateKeyError } from "@/shared/lib/mongo-error";
import { Partner } from "@/features/partners/model";
import PartnerSettlementEntry, {
  type PartnerSettlementChannel,
  type PartnerSettlementType,
} from "@/features/partners/model/PartnerSettlementEntry";
import { roundMoney } from "@/features/partners/lib/partner-share-delta";

export type LedgerPost = {
  partnerId: string;
  bookingId?: string;
  type: PartnerSettlementType;
  balanceDelta: number;
  amount?: number;
  currency: string;
  channel?: PartnerSettlementChannel;
  method?: "cash" | "bank" | "other";
  reference?: string;
  note?: string;
  createdBy?: string;
  reversesEntryId?: string;
  fare?: number;
  margin?: number;
  partnerShare?: number;
};

export async function postPartnerLedger(input: LedgerPost) {
  await connectDB();
  const delta = roundMoney(input.balanceDelta);
  const amount = roundMoney(input.amount ?? Math.abs(delta));
  const session = await mongoose.startSession();

  try {
    let saved: unknown = null;
    await session.withTransaction(async () => {
      const existing = await findExisting(input).session(session);
      if (existing) {
        saved = existing;
        return;
      }

      const [created] = await PartnerSettlementEntry.create(
        [
          {
            partnerId: input.partnerId,
            bookingId: input.bookingId,
            type: input.type,
            channel: input.channel,
            amount,
            balanceDelta: delta,
            currency: input.currency.toLowerCase(),
            method: input.method,
            reference: input.reference,
            note: input.note,
            createdBy: input.createdBy,
            reversesEntryId: input.reversesEntryId,
            fare: input.fare,
            margin: input.margin,
            partnerShare: input.partnerShare,
          },
        ],
        { session },
      );
      if (delta !== 0) {
        await Partner.updateOne(
          { _id: input.partnerId },
          { $inc: { balance: delta } },
          { session },
        );
      } else {
        await Partner.updateOne(
          { _id: input.partnerId, balance: { $exists: false } },
          { $set: { balance: 0 } },
          { session },
        );
      }
      saved = created;
    });
    return saved;
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    return findExisting(input);
  } finally {
    await session.endSession();
  }
}

function findExisting(input: LedgerPost) {
  if (input.reversesEntryId) {
    return PartnerSettlementEntry.findOne({ reversesEntryId: input.reversesEntryId });
  }
  if (input.type === "opening_balance") {
    return PartnerSettlementEntry.findOne({
      partnerId: input.partnerId,
      type: "opening_balance",
    });
  }
  if (input.bookingId && (input.type === "ride_credit" || input.type === "payout_credit" || input.type === "remittance_credit")) {
    return PartnerSettlementEntry.findOne({
      partnerId: input.partnerId,
      bookingId: input.bookingId,
      type: input.type,
    });
  }
  return PartnerSettlementEntry.findOne({ _id: { $exists: false } });
}

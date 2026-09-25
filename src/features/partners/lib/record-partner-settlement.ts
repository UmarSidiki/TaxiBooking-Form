import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import PartnerSettlementEntry, {
  type PartnerSettlementChannel,
  type PartnerSettlementType,
} from "@/features/partners/model/PartnerSettlementEntry";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export async function recordPartnerSettlement(input: {
  partnerId: string;
  bookingId?: string;
  type: PartnerSettlementType;
  channel?: PartnerSettlementChannel;
  amount: number;
  currency: string;
  note?: string;
  createdBy?: string;
  balanceInc: {
    payoutBalance?: number;
    remittanceBalance?: number;
    totalEarnings?: number;
    onlineEarnings?: number;
    cashEarnings?: number;
  };
  extraSet?: Record<string, unknown>;
  /** Skip create if an identical credit already exists for this booking. */
  idempotentCredit?: boolean;
}) {
  if (!(input.amount > 0) && Object.keys(input.balanceInc).length === 0) {
    return null;
  }

  await connectDB();

  if (
    input.idempotentCredit &&
    input.bookingId &&
    (input.type === "payout_credit" || input.type === "remittance_credit")
  ) {
    const existing = await PartnerSettlementEntry.findOne({
      partnerId: input.partnerId,
      bookingId: input.bookingId,
      type: input.type,
    }).lean();
    if (existing) {
      return existing;
    }
  }

  let entry;
  try {
    entry = await PartnerSettlementEntry.create({
      partnerId: input.partnerId,
      bookingId: input.bookingId,
      type: input.type,
      channel: input.channel,
      amount: Math.abs(input.amount),
      currency: input.currency.toLowerCase(),
      note: input.note,
      createdBy: input.createdBy,
    });
  } catch (error) {
    if (
      input.idempotentCredit &&
      isDuplicateKeyError(error) &&
      input.bookingId
    ) {
      return PartnerSettlementEntry.findOne({
        partnerId: input.partnerId,
        bookingId: input.bookingId,
        type: input.type,
      }).lean();
    }
    throw error;
  }

  const update: Record<string, unknown> = {};
  if (Object.keys(input.balanceInc).length) {
    update.$inc = input.balanceInc;
  }
  if (input.extraSet && Object.keys(input.extraSet).length) {
    update.$set = input.extraSet;
  }

  if (Object.keys(update).length) {
    await Partner.findByIdAndUpdate(input.partnerId, update);
  }

  return entry;
}

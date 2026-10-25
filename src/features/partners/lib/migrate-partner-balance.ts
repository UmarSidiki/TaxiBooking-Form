import { Partner } from "@/features/partners/model";
import PartnerSettlementEntry from "@/features/partners/model/PartnerSettlementEntry";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";
import { postPartnerLedger } from "@/features/partners/lib/post-partner-ledger";
import { roundMoney } from "@/features/partners/lib/partner-share-delta";

export type BalanceMigrationRow = {
  partnerId: string;
  name: string;
  delta: number;
  action: "skip" | "would-write" | "wrote";
};

/** One opening ledger row per partner. Safe to run more than once. */
export async function migratePartnerBalances(dryRun: boolean) {
  const partners = await Partner.find().select("name payoutBalance remittanceBalance");
  const { currency } = await getPartnerDispatchSettings();
  const rows: BalanceMigrationRow[] = [];

  for (const partner of partners) {
    const partnerId = String(partner._id);
    const existing = await PartnerSettlementEntry.findOne({
      partnerId,
      type: "opening_balance",
    }).lean();
    const delta = roundMoney((partner.payoutBalance ?? 0) - (partner.remittanceBalance ?? 0));
    if (existing) {
      rows.push({ partnerId, name: partner.name, delta, action: "skip" });
      continue;
    }
    if (dryRun) {
      rows.push({ partnerId, name: partner.name, delta, action: "would-write" });
      continue;
    }
    await postPartnerLedger({
      partnerId,
      type: "opening_balance",
      balanceDelta: delta,
      amount: Math.abs(delta),
      currency,
      note: "Opening balance from payout and remittance counters",
    });
    rows.push({ partnerId, name: partner.name, delta, action: "wrote" });
  }

  return rows;
}

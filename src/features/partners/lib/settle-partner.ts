import { Partner } from "@/features/partners/model";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";
import { postPartnerLedger } from "@/features/partners/lib/post-partner-ledger";
import { readPartnerBalance } from "@/features/partners/lib/partner-share-delta";
import type { PartnerSettlementInput } from "@/features/partners/schema/partner-settlement.schema";
import { queueAssigneeNotice } from "@/features/settings/lib/assignee-whatsapp";

export async function settlePartner(
  partnerId: string,
  input: PartnerSettlementInput,
  createdBy?: string,
) {
  const partner = await Partner.findById(partnerId).select("balance payoutBalance remittanceBalance");
  if (!partner) return { ok: false as const, status: 404 };

  const { currency } = await getPartnerDispatchSettings();
  const balanceDelta = input.direction === "pay_partner" ? -input.amount : input.amount;
  await postPartnerLedger({
    partnerId,
    type: "settlement",
    balanceDelta,
    amount: input.amount,
    currency,
    method: input.method,
    reference: input.reference,
    note: input.note,
    createdBy,
  });

  const refreshed = await Partner.findById(partnerId).select("phone name balance payoutBalance remittanceBalance");
  queueAssigneeNotice({
    kind: "settlement",
    recipients: [{ phone: refreshed?.phone, name: refreshed?.name }],
    amount: input.amount,
    currency,
  });
  return {
    ok: true as const,
    balance: readPartnerBalance(refreshed),
    partner: refreshed,
  };
}

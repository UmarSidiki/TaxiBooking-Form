# Partner settlement ledger

Zeroing `payoutBalance` on “mark paid” destroyed history and made cancel/refund clawbacks impossible to audit. We append immutable `PartnerSettlementEntry` rows for every credit, payout, remittance, and clawback, and keep running balances on Partner as derived counters updated in the same write path. Recalculate prefers the ledger as source of truth going forward.

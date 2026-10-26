export type ZoneRow = { _id: string; fromLabel: string; toLabel: string; price: number };
export type PromoRow = {
  _id: string;
  code: string;
  kind: "percent" | "fixed";
  amount: number;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  usedCount?: number;
};

export async function postPricing(body: unknown) {
  const response = await fetch("/api/admin/pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return response.ok;
}

export async function deletePricing(kind: "zone" | "promo", id: string) {
  const response = await fetch(`/api/admin/pricing?kind=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
  return response.ok;
}

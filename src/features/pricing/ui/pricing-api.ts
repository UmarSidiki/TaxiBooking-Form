export type PromoRow = {
  _id: string;
  code: string;
  kind: "percent" | "fixed";
  amount: number;
  active?: boolean;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  usedCount?: number;
};

export async function postPricing(body: unknown) {
  const response = await fetch("/api/admin/pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return response.ok;
}

export async function setPromoActive(id: string, active: boolean) {
  const response = await fetch("/api/admin/pricing", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, active }),
  });
  return response.ok;
}

export async function deletePricing(kind: "promo", id: string) {
  const response = await fetch(`/api/admin/pricing?kind=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
  return response.ok;
}

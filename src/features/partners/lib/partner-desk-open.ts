/** Active partners work. `approved` stays readable until the access migration. */
export function partnerDeskOpen(status?: string | null) {
  return status === "active" || status === "approved";
}

export function isAssignablePartner(partner: {
  status?: string | null;
  isActive?: boolean | null;
}) {
  return partnerDeskOpen(partner.status) && partner.isActive !== false;
}

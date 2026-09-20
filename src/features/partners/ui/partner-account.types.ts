import type { PartnerDocument } from "@/components/admin-partners/admin-partner.types";

export type PartnerAccountData = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  documents: PartnerDocument[];
  rejectionReason?: string;
  registeredAt: string;
};

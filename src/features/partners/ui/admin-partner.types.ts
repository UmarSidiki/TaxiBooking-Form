export interface PartnerDocument {
  type: string;
  fileName: string;
  fileData: string;
  mimeType: string;
  fileSize: number;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  rejectionReason?: string;
}

export interface Vehicle {
  _id: string;
  name: string;
  category: string;
  image?: string;
}

export interface Partner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  documents: PartnerDocument[];
  registeredAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  fleetRequests?: Array<{
    vehicleId: string;
    status: "none" | "pending" | "approved" | "rejected";
    requestedAt: string;
    approvedAt?: string;
    approvedBy?: string;
    rejectionReason?: string;
  }>;
  currentFleet?: string;
  requestedFleet?: string;
  fleetStatus?: "none" | "pending" | "approved" | "rejected";
  fleetRequestedAt?: string;
  fleetApprovedAt?: string;
  fleetRejectionReason?: string;
  totalEarnings?: number;
  onlineEarnings?: number;
  cashEarnings?: number;
  payoutBalance?: number;
  remittanceBalance?: number;
  lastPayoutAt?: string;
  lastRemittanceAt?: string;
  billingDetails?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    iban?: string;
    swift?: string;
    notes?: string;
  };
}

import { connectDB } from "@/shared/db";
import CustomerSession from "@/features/customers/model/CustomerSession";
import RideCharge from "@/features/invoices/model/RideCharge";
import WhatsAppSendLog from "@/features/settings/model/WhatsAppSendLog";
import { PROFILE_BOOKINGS_LIMIT } from "@/features/customers-admin/lib/customer-profile/customer-profile.repo";

const PROFILE_SESSIONS_LIMIT = 50;

export type ProfileChargeDoc = {
  _id: unknown;
  orderId: string;
  tripId: string;
  amount: number;
  purpose: string;
  provider: string;
  status?: string | null;
  createdAt?: Date | null;
};

export type ProfileSessionDoc = {
  _id: unknown;
  uaFamily?: string | null;
  ipPrefix?: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
};

export type ProfileSendDoc = {
  createdAt?: Date | null;
  status: string;
  kind: string;
};

export async function findRideCharges(
  tripIds: string[],
): Promise<ProfileChargeDoc[]> {
  if (tripIds.length === 0) return [];
  await connectDB();
  return RideCharge.find({ tripId: { $in: tripIds } })
    .select("orderId tripId amount purpose provider status createdAt")
    .sort({ createdAt: -1 })
    .limit(PROFILE_BOOKINGS_LIMIT * 2)
    .lean<ProfileChargeDoc[]>();
}

export async function findCustomerSessions(
  emailLower: string,
): Promise<ProfileSessionDoc[]> {
  await connectDB();
  return CustomerSession.find({ emailLower })
    .select("uaFamily ipPrefix createdAt lastSeenAt expiresAt revokedAt")
    .sort({ lastSeenAt: -1 })
    .limit(PROFILE_SESSIONS_LIMIT)
    .lean<ProfileSessionDoc[]>();
}

export async function findLastWhatsAppSend(
  jid: string,
): Promise<ProfileSendDoc | null> {
  await connectDB();
  return WhatsAppSendLog.findOne({ jid })
    .select("status kind createdAt")
    .sort({ createdAt: -1 })
    .lean<ProfileSendDoc | null>();
}

import { connectDB } from "@/shared/db";
import CampaignRecipient from "@/features/marketing/model/CampaignRecipient";

export async function claimRecipient(
  recipientId: unknown,
  leaseMs: number,
  now: Date,
): Promise<boolean> {
  await connectDB();
  const pendingClaim = await CampaignRecipient.findOneAndUpdate(
    { _id: recipientId, status: "pending" },
    {
      $set: {
        status: "sending",
        leaseExpiresAt: new Date(now.getTime() + leaseMs),
      },
      $inc: { attempts: 1 },
    },
  );
  if (pendingClaim) return true;

  const reclaimed = await CampaignRecipient.findOneAndUpdate(
    {
      _id: recipientId,
      status: "sending",
      leaseExpiresAt: { $lte: now },
    },
    {
      $set: {
        status: "sending",
        leaseExpiresAt: new Date(now.getTime() + leaseMs),
      },
      $inc: { attempts: 1 },
    },
  );
  return Boolean(reclaimed);
}

export async function reclaimStaleRecipients(campaignId: unknown, now: Date) {
  await connectDB();
  await CampaignRecipient.updateMany(
    {
      campaignId,
      status: "sending",
      leaseExpiresAt: { $lte: now },
    },
    { $set: { status: "pending", leaseExpiresAt: null } },
  );
}
import { connectDB } from "@/shared/db";
import Campaign from "@/features/marketing/model/Campaign";
import CampaignRecipient from "@/features/marketing/model/CampaignRecipient";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";
import type { CampaignWriteInput } from "@/features/marketing/schema/campaign.schema";

export type CampaignView = {
  id: string;
  name: string;
  channel: MarketingChannel;
  segmentId: string | null;
  templateId: string | null;
  templateVersion: number;
  scheduledAt: string | null;
  status: string;
  throttle: { perRun: number; dailyCap: number };
  quietHours: { startHour: number; endHour: number; timeZone: string };
  stats: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type CampaignDoc = {
  _id: unknown;
  name: string;
  channel: MarketingChannel;
  segmentId?: unknown;
  templateId?: unknown;
  templateVersion?: number;
  scheduledAt?: Date | null;
  status: string;
  throttle?: { perRun?: number; dailyCap?: number };
  quietHours?: { startHour?: number; endHour?: number; timeZone?: string };
  stats?: Record<string, unknown>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

const CAMPAIGN_LIMIT = 200;

function toView(doc: CampaignDoc): CampaignView {
  return {
    id: String(doc._id),
    name: doc.name,
    channel: doc.channel,
    segmentId: doc.segmentId ? String(doc.segmentId) : null,
    templateId: doc.templateId ? String(doc.templateId) : null,
    templateVersion: doc.templateVersion ?? 1,
    scheduledAt: doc.scheduledAt ? new Date(doc.scheduledAt).toISOString() : null,
    status: doc.status,
    throttle: {
      perRun: doc.throttle?.perRun ?? 50,
      dailyCap: doc.throttle?.dailyCap ?? 0,
    },
    quietHours: {
      startHour: doc.quietHours?.startHour ?? 20,
      endHour: doc.quietHours?.endHour ?? 9,
      timeZone: doc.quietHours?.timeZone ?? "UTC",
    },
    stats: doc.stats ?? {},
    createdBy: doc.createdBy ?? "",
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listCampaigns(
  filter: { status?: string; channel?: MarketingChannel } = {},
): Promise<CampaignView[]> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filter.status) query.status = filter.status;
  if (filter.channel) query.channel = filter.channel;
  const docs = await Campaign.find(query)
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(CAMPAIGN_LIMIT)
    .lean<CampaignDoc[]>();
  return docs.map(toView);
}

export async function getCampaign(id: string): Promise<CampaignView | null> {
  if (!isObjectIdString(id)) return null;
  await connectDB();
  const doc = await Campaign.findById(id).lean<CampaignDoc | null>();
  return doc ? toView(doc) : null;
}

export async function createCampaign(
  input: CampaignWriteInput & { createdBy?: string },
): Promise<CampaignView> {
  await connectDB();
  const doc = await Campaign.create({
    name: input.name,
    channel: input.channel,
    segmentId: input.segmentId ?? null,
    templateId: input.templateId ?? null,
    templateVersion: input.templateVersion ?? 1,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    status: input.scheduledAt ? "scheduled" : "draft",
    throttle: input.throttle ?? { perRun: 50, dailyCap: 0 },
    quietHours: input.quietHours ?? { startHour: 20, endHour: 9, timeZone: "UTC" },
    stats: {},
    createdBy: input.createdBy ?? "",
  });
  return toView(doc.toObject() as CampaignDoc);
}

export async function updateCampaign(
  id: string,
  patch: Partial<CampaignWriteInput>,
): Promise<CampaignView | null> {
  if (!isObjectIdString(id)) return null;
  await connectDB();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.channel !== undefined) update.channel = patch.channel;
  if (patch.segmentId !== undefined) update.segmentId = patch.segmentId;
  if (patch.templateId !== undefined) update.templateId = patch.templateId;
  if (patch.templateVersion !== undefined)
    update.templateVersion = patch.templateVersion;
  if (patch.scheduledAt !== undefined)
    update.scheduledAt = patch.scheduledAt ? new Date(patch.scheduledAt) : null;
  if (patch.throttle !== undefined) update.throttle = patch.throttle;
  if (patch.quietHours !== undefined) update.quietHours = patch.quietHours;
  if (Object.keys(update).length === 0) return getCampaign(id);
  const doc = await Campaign.findByIdAndUpdate(id, { $set: update }, { new: true })
    .lean<CampaignDoc | null>();
  return doc ? toView(doc) : null;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  if (!isObjectIdString(id)) return false;
  await connectDB();
  await CampaignRecipient.deleteMany({ campaignId: id });
  const result = await Campaign.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

export async function scheduleCampaign(
  id: string,
  scheduledAt: Date | null,
): Promise<CampaignView | null> {
  if (!isObjectIdString(id)) return null;
  await connectDB();
  const doc = await Campaign.findByIdAndUpdate(
    id,
    {
      $set: {
        scheduledAt,
        status: scheduledAt ? "scheduled" : "draft",
      },
    },
    { new: true },
  ).lean<CampaignDoc | null>();
  return doc ? toView(doc) : null;
}

export async function pauseCampaign(id: string): Promise<CampaignView | null> {
  if (!isObjectIdString(id)) return null;
  await connectDB();
  const doc = await Campaign.findOneAndUpdate(
    { _id: id, status: { $in: ["scheduled", "sending"] } },
    { $set: { status: "paused" } },
    { new: true },
  ).lean<CampaignDoc | null>();
  return doc ? toView(doc) : null;
}

export async function resumeCampaign(id: string): Promise<CampaignView | null> {
  if (!isObjectIdString(id)) return null;
  await connectDB();
  const doc = await Campaign.findOneAndUpdate(
    { _id: id, status: "paused" },
    { $set: { status: "scheduled" } },
    { new: true },
  ).lean<CampaignDoc | null>();
  return doc ? toView(doc) : null;
}

export async function cancelCampaign(id: string): Promise<CampaignView | null> {
  if (!isObjectIdString(id)) return null;
  await connectDB();
  const doc = await Campaign.findOneAndUpdate(
    { _id: id, status: { $nin: ["done", "cancelled"] } },
    { $set: { status: "cancelled" } },
    { new: true },
  ).lean<CampaignDoc | null>();
  return doc ? toView(doc) : null;
}

export async function getCampaignStats(id: string): Promise<Record<string, unknown> | null> {
  const campaign = await getCampaign(id);
  return campaign ? campaign.stats : null;
}

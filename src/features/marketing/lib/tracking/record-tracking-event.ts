import { connectDB } from "@/shared/db";
import ClickEvent from "@/features/marketing/model/ClickEvent";
import Setting from "@/features/settings/model/Setting";

export type TrackingKind = "open" | "click";

export async function isTrackingEnabled(kind: TrackingKind): Promise<boolean> {
  await connectDB();
  const setting = await Setting.findOne({}).lean<{ marketingTrackOpens?: boolean; marketingTrackClicks?: boolean } | null>();
  if (kind === "open") return Boolean(setting?.marketingTrackOpens);
  return Boolean(setting?.marketingTrackClicks);
}

export async function recordTrackingEvent(input: {
  campaignId: string;
  recipientId?: string | null;
  type: TrackingKind;
  url?: string;
}): Promise<void> {
  await connectDB();
  await ClickEvent.create({
    campaignId: input.campaignId,
    recipientId: input.recipientId ?? null,
    type: input.type,
    url: input.url ?? "",
    at: new Date(),
  });
}
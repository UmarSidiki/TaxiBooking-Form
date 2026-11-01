import { connectDB } from "@/shared/db";
import CampaignTemplate, {
  type CampaignTemplateLocaleContent,
} from "@/features/marketing/model/CampaignTemplate";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";
import {
  extractTemplateVariables,
  type CampaignTemplateWriteInput,
} from "@/features/marketing/schema/campaign-template.schema";

export type CampaignTemplateView = {
  id: string;
  channel: MarketingChannel;
  name: string;
  locales: Record<string, CampaignTemplateLocaleContent>;
  variables: string[];
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type TemplateDoc = {
  _id: unknown;
  channel: MarketingChannel;
  name: string;
  locales: Record<string, CampaignTemplateLocaleContent>;
  variables?: string[];
  version?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

const TEMPLATE_LIMIT = 100;

export function deriveTemplateVariables(
  input: CampaignTemplateWriteInput,
): string[] {
  return extractTemplateVariables(
    ...Object.values(input.locales).flatMap((content) => [
      content.subject,
      content.preheader,
      content.body,
    ]),
  );
}

function toView(doc: TemplateDoc): CampaignTemplateView {
  return {
    id: String(doc._id),
    channel: doc.channel,
    name: doc.name,
    locales: doc.locales ?? {},
    variables: doc.variables ?? deriveTemplateVariables(doc),
    version: doc.version ?? 1,
    createdBy: doc.createdBy ?? "",
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listCampaignTemplates(): Promise<CampaignTemplateView[]> {
  await connectDB();
  const docs = await CampaignTemplate.find({})
    .sort({ updatedAt: -1 })
    .limit(TEMPLATE_LIMIT)
    .lean<TemplateDoc[]>();
  return docs.map(toView);
}

export async function getCampaignTemplate(
  id: string,
): Promise<CampaignTemplateView | null> {
  if (!isObjectIdString(id)) return null;
  await connectDB();
  const doc = await CampaignTemplate.findById(id).lean<TemplateDoc | null>();
  return doc ? toView(doc) : null;
}

export async function createCampaignTemplate(
  input: CampaignTemplateWriteInput & { createdBy?: string },
): Promise<CampaignTemplateView> {
  await connectDB();
  const doc = await CampaignTemplate.create({
    channel: input.channel,
    name: input.name,
    locales: input.locales,
    variables: deriveTemplateVariables(input),
    version: 1,
    createdBy: input.createdBy ?? "",
  });
  return toView(doc.toObject() as TemplateDoc);
}

export async function updateCampaignTemplate(
  id: string,
  input: CampaignTemplateWriteInput,
): Promise<CampaignTemplateView | null> {
  if (!isObjectIdString(id)) return null;
  await connectDB();
  const current = await CampaignTemplate.findById(id)
    .select("version")
    .lean<{ version?: number } | null>();
  if (!current) return null;

  const doc = await CampaignTemplate.findByIdAndUpdate(
    id,
    {
      $set: {
        channel: input.channel,
        name: input.name,
        locales: input.locales,
        variables: deriveTemplateVariables(input),
        version: (current.version ?? 1) + 1,
      },
    },
    { new: true },
  ).lean<TemplateDoc | null>();
  return doc ? toView(doc) : null;
}

export async function deleteCampaignTemplate(id: string): Promise<boolean> {
  if (!isObjectIdString(id)) return false;
  await connectDB();
  const result = await CampaignTemplate.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

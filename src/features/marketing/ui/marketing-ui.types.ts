import type { CustomerListParams } from "@/features/customers-admin/schema/customer-list.schema";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";

export type MarketingSegment = {
  id: string;
  name: string;
  filter: CustomerListParams;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type MarketingTemplateLocale = {
  subject: string;
  preheader: string;
  body: string;
};

export type MarketingTemplate = {
  id: string;
  channel: MarketingChannel;
  name: string;
  locales: Record<string, MarketingTemplateLocale>;
  variables: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type SegmentCountView = {
  channel: MarketingChannel;
  total: number;
  eligible: number;
  excluded: number;
};

export type TemplatePreviewView = {
  template: MarketingTemplate;
  customer: { email: string; name: string; locale: string };
  locale: string;
  fallbackUsed: boolean;
  subject: string;
  preheader: string;
  body: string;
  text: string;
  missingVariables: string[];
};

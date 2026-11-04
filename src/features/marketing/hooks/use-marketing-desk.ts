"use client";

import { useCallback, useEffect, useState } from "react";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/http/api";
import type { CustomerListParams } from "@/features/customers-admin/schema/customer-list.schema";
import type { CampaignTemplateWriteInput } from "@/features/marketing/schema/campaign-template.schema";
import type {
  MarketingSegment,
  MarketingTemplate,
} from "@/features/marketing/ui/marketing-ui.types";

export function useMarketingDesk() {
  const [segments, setSegments] = useState<MarketingSegment[]>([]);
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const [segmentData, templateData] = await Promise.all([
        apiGet<{ success: true; segments: MarketingSegment[] }>(
          "/api/admin/marketing/segments",
        ),
        apiGet<{ success: true; templates: MarketingTemplate[] }>(
          "/api/admin/marketing/templates",
        ),
      ]);
      setSegments(segmentData.segments);
      setTemplates(templateData.templates);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createSegment = useCallback(
    async (name: string, filter: CustomerListParams) => {
      const data = await apiPost<{ success: true; segment: MarketingSegment }>(
        "/api/admin/marketing/segments",
        {
          name,
          filter: {
            ...filter,
            cursor: undefined,
            sort: undefined,
            dir: undefined,
            emailConsent: "any",
            whatsappConsent: "any",
            verifiedWhatsApp: "any",
          },
        },
      );
      setSegments((prev) => [data.segment, ...prev]);
      return data.segment;
    },
    [],
  );

  const deleteSegment = useCallback(async (id: string) => {
    await apiDelete(`/api/admin/marketing/segments/${id}`);
    setSegments((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const saveTemplate = useCallback(
    async (
      input: CampaignTemplateWriteInput,
      id?: string,
    ): Promise<MarketingTemplate> => {
      const data = id
        ? await apiPatch<{ success: true; template: MarketingTemplate }>(
            `/api/admin/marketing/templates/${id}`,
            input,
          )
        : await apiPost<{ success: true; template: MarketingTemplate }>(
            "/api/admin/marketing/templates",
            input,
          );
      setTemplates((prev) =>
        id
          ? prev.map((row) => (row.id === id ? data.template : row))
          : [data.template, ...prev],
      );
      return data.template;
    },
    [],
  );

  const deleteTemplate = useCallback(async (id: string) => {
    await apiDelete(`/api/admin/marketing/templates/${id}`);
    setTemplates((prev) => prev.filter((row) => row.id !== id));
  }, []);

  return {
    segments,
    templates,
    isLoading,
    error,
    reload,
    createSegment,
    deleteSegment,
    saveTemplate,
    deleteTemplate,
  };
}

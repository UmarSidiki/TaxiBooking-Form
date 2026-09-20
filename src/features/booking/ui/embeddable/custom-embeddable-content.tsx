"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import type { IFormLayout } from "@/features/form-builder/model";
import { DynamicBookingForm } from "@/features/booking/ui/embeddable/custom-dynamic-booking-form";

export function CustomEmbeddableContent() {
  const t = useTranslations("embeddable");
  const params = useParams();
  const id = params?.id as string;
  const [layout, setLayout] = useState<IFormLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const response = await fetch(`/api/form-layouts/${id}`);
        const data = await response.json();

        if (data.success && data.data) {
          if (data.data.isActive) {
            setLayout(data.data);
          } else {
            setError(t("form-inactive"));
          }
        } else {
          setError(t("layout-not-found"));
        }
      } catch (err) {
        setError(t("failed-to-load"));
        console.error("Error fetching layout:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLayout();
  }, [id, t]);

  // Iframe resize observer
  useEffect(() => {
    if (typeof window === "undefined") return;
    const postHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "meetswiss-resize", height }, "*");
    };
    const observer = new ResizeObserver(() => postHeight());
    observer.observe(document.body);
    const mutationObserver = new MutationObserver(() => postHeight());
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !layout) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">
              {t("form-unavailable")}
            </p>
            <p className="text-sm text-muted-foreground">
              {error || t("unavailable-description")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <DynamicBookingForm layout={layout} />;
}

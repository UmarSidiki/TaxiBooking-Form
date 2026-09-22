"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/shared/http/api";
import type { ISetting } from "@/features/settings/model";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface FormBuilderGuardProps {
  children: React.ReactNode;
}

export default function FormBuilderGuard({ children }: FormBuilderGuardProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const data = await apiGet<{
          success: boolean;
          data: Partial<ISetting>;
        }>("/api/settings");
        if (data.success) {
          setIsEnabled(data.data.enableFormBuilder !== false);
        }
      } catch (error) {
        console.error("Error checking form builder setting:", error);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeature();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status">
        <div className="text-center">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-md bg-muted">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">{t("FormBuilder.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="flex min-h-64 items-center justify-center bg-background">
        <div className="max-w-md">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
              <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
            {t("form-builder.disabled-title") || "Module Disabled"}
          </h1>
          <p className="text-muted-foreground mb-6 text-center">
            {t("form-builder.disabled-message") ||
              "The form builder module is currently disabled by the administrator."}
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => router.back()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t("common.go-back") || "Go Back"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

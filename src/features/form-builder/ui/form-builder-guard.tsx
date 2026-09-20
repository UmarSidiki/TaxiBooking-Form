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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">{t("FormBuilder.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="max-w-md">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
              <AlertCircle className="w-8 h-8 text-destructive" />
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.go-back") || "Go Back"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

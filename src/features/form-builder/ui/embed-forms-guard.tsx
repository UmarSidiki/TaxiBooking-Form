"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/shared/http/api";
import type { ISetting } from "@/features/settings/model";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmbedFormsGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const data = await apiGet<{
          success: boolean;
          data: Partial<ISetting>;
        }>("/api/settings");
        if (data.success) {
          setIsEnabled(data.data.enableEmbeddableForm !== false);
        }
      } catch {
        setIsEnabled(false);
      }
    };

    void checkFeature();
  }, []);

  if (isEnabled === null) {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="flex min-h-64 items-center justify-center bg-background">
        <div className="max-w-md">
          <div className="mb-4 flex justify-center">
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
            </div>
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold text-foreground">
            {t("embeddable.disabled-title")}
          </h1>
          <p className="mb-6 text-center text-muted-foreground">
            {t("embeddable.disabled-message")}
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t("common.go-home")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

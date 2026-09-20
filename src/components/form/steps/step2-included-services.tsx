"use client";

import { CheckCircle2, Shield } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function Step2IncludedServices({ t }: { t: TFn }) {
  return (
          <div className="border-t pt-3 space-y-2">
            <h4 className="font-semibold text-sm mb-2">
              {t("Step2.included-services")}
            </h4>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t("Step2.door-to-door")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t("Step2.meet-and-greet")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t("Step2.instant-booking-confirmation")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t("Step2.no-further-costs")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>{t("Step2.secure-payment-methods")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t("Step2.easy-cancellation")}</span>
              </div>
            </div>
          </div>
  );
}

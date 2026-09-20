"use client";

import type { PartnerAccountData } from "@/components/partner-account/partner-account.types";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Dashboard">>;

export function PartnerAccountBanners({
  t,
  partner,
  hasDocumentsUnderReview,
}: {
  t: TFn;
  partner: PartnerAccountData;
  hasDocumentsUnderReview: boolean | undefined;
}) {
  return (
    <>
      {partner.status === "pending" && hasDocumentsUnderReview && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 animate-pulse" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  {t("documents-under-review")}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {t("your-documents-are-currently-being-reviewed")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {partner.status === "pending" && !hasDocumentsUnderReview && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {t("action-required-upload-documents")}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {t("please-upload-all-required-documents")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {partner.status === "rejected" && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  {t("account-rejected")}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {partner.rejectionReason ||
                    t("your-account-has-been-rejected")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {partner.status === "approved" && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  {t("account-approved")}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {t("your-account-has-been-approved")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

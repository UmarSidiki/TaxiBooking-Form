"use client";

import { Input } from "@/shared/ui/input";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";
import { Banknote, Building2, CreditCard } from "lucide-react";
import { useCurrency } from "@/shared/context/currency-context";


export function PaymentTabBank({
  settings,
  handleMapSettingsChange,
  t,
}: Pick<PaymentTabFieldsProps, "settings" | "handleMapSettingsChange" | "t">) {
  return (
    <>
        {/* Bank Account Details */}
        {settings.acceptedPaymentMethods?.includes("bank_transfer") && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("Dashboard.Settings.bank-account-details")}{" "}
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              {t(
                "Dashboard.Settings.these-details-will-be-shown-to-customers-who-choose-bank-transfer-payment"
              )}{" "}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("Dashboard.Settings.bank-name")}
                </label>
                <Input
                  type="text"
                  placeholder={t("Dashboard.Settings.ubs-switzerland-ag")}
                  value={settings.bankName ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange("bankName", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("Dashboard.Settings.account-name")}
                </label>
                <Input
                  type="text"
                  placeholder={t("Dashboard.Settings.company-name")}
                  value={settings.bankAccountName ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange(
                      "bankAccountName",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("Dashboard.Settings.account-number")}
                </label>
                <Input
                  type="text"
                  placeholder="123456789"
                  value={settings.bankAccountNumber ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange(
                      "bankAccountNumber",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  IBAN
                </label>
                <Input
                  type="text"
                  placeholder={t(
                    "Dashboard.Settings.ch93-0076-2011-6238-5295-7"
                  )}
                  value={settings.bankIBAN ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange("bankIBAN", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  SWIFT/BIC
                </label>
                <Input
                  type="text"
                  placeholder="UBSWCHZH80A"
                  value={settings.bankSwiftBIC ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange(
                      "bankSwiftBIC",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}

    </>
  );
}

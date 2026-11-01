"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  CUSTOMER_LOCALES,
  type CustomerListParams,
} from "@/features/customers-admin/schema/customer-list.schema";
import {
  ConsentSelect,
  TriStateSelect,
} from "@/features/customers-admin/ui/customers-filter-small-selects";

type Draft = CustomerListParams;
type OnChange = (patch: Partial<Draft>) => void;

export function CustomerFilterSelects({
  draft,
  onChange,
}: {
  draft: Draft;
  onChange: OnChange;
}) {
  const t = useTranslations("Dashboard.Customers");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customer-last-ride">{t("last-ride")}</Label>
          <Select
            value={draft.lastRide}
            onValueChange={(value) =>
              onChange({ lastRide: value as Draft["lastRide"] })
            }
          >
            <SelectTrigger id="customer-last-ride" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("last-ride-any")}</SelectItem>
              <SelectItem value="within">{t("last-ride-within")}</SelectItem>
              <SelectItem value="before">{t("last-ride-before")}</SelectItem>
              <SelectItem value="never">{t("last-ride-never")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customer-last-ride-days">{t("days")}</Label>
          <Input
            id="customer-last-ride-days"
            type="number"
            min={1}
            max={3650}
            inputMode="numeric"
            disabled={draft.lastRide === "any" || draft.lastRide === "never"}
            value={draft.lastRideDays}
            onChange={(event) =>
              onChange({ lastRideDays: Number(event.target.value) || 30 })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TriStateSelect
          id="customer-verified"
          label={t("verified-whatsapp")}
          value={draft.verifiedWhatsApp}
          onChange={(value) =>
            onChange({ verifiedWhatsApp: value as Draft["verifiedWhatsApp"] })
          }
        />
        <TriStateSelect
          id="customer-upcoming"
          label={t("upcoming")}
          value={draft.upcoming}
          onChange={(value) =>
            onChange({ upcoming: value as Draft["upcoming"] })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ConsentSelect
          id="customer-email-consent"
          label={t("email-consent")}
          value={draft.emailConsent}
          onChange={(value) =>
            onChange({ emailConsent: value as Draft["emailConsent"] })
          }
        />
        <ConsentSelect
          id="customer-whatsapp-consent"
          label={t("whatsapp-consent")}
          value={draft.whatsappConsent}
          onChange={(value) =>
            onChange({ whatsappConsent: value as Draft["whatsappConsent"] })
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customer-locale">{t("locale")}</Label>
        <Select
          value={draft.locale}
          onValueChange={(value) =>
            onChange({ locale: value as Draft["locale"] })
          }
        >
          <SelectTrigger id="customer-locale" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("any")}</SelectItem>
            {CUSTOMER_LOCALES.map((code) => (
              <SelectItem key={code} value={code}>
                {t(`locale-${code}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

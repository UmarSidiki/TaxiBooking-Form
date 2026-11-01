"use client";

import type { Dispatch, SetStateAction } from "react";
import type { useTranslations } from "next-intl";

import { Input } from "@/shared/ui/input";
import type { ISetting } from "@/features/settings/model";

type Props = {
  settings: Partial<ISetting>;
  setSettings: Dispatch<SetStateAction<Partial<ISetting>>>;
  t: ReturnType<typeof useTranslations>;
};

export function MarketingSenderFields({ settings, setSettings, t }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="marketing-sender-name" className="mb-2 block text-sm font-medium">
          {t("from-name")}
        </label>
        <Input
          id="marketing-sender-name"
          name="marketing-sender-name"
          type="text"
          autoComplete="organization"
          value={settings.marketingSenderName ?? ""}
          onChange={(event) =>
            setSettings((prev) => ({ ...prev, marketingSenderName: event.target.value }))
          }
        />
      </div>
      <div>
        <label htmlFor="marketing-sender-email" className="mb-2 block text-sm font-medium">
          {t("from-email")}
        </label>
        <Input
          id="marketing-sender-email"
          name="marketing-sender-email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          value={settings.marketingSenderEmail ?? ""}
          onChange={(event) =>
            setSettings((prev) => ({ ...prev, marketingSenderEmail: event.target.value }))
          }
        />
      </div>
      <div>
        <label htmlFor="marketing-reply-to" className="mb-2 block text-sm font-medium">
          {t("reply-to")}
        </label>
        <Input
          id="marketing-reply-to"
          name="marketing-reply-to"
          type="email"
          autoComplete="email"
          spellCheck={false}
          value={settings.marketingReplyTo ?? ""}
          onChange={(event) =>
            setSettings((prev) => ({ ...prev, marketingReplyTo: event.target.value }))
          }
        />
      </div>
      <p className="text-sm text-muted-foreground md:col-span-2">
        {t("fallback-note")}
      </p>
    </div>
  );
}

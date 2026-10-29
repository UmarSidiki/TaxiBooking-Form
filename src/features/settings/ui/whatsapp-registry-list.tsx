"use client";

import { useTranslations } from "next-intl";

import type { RegistryEventRow } from "@/features/settings/lib/whatsapp-registry-types";
import { SettingsSection } from "@/features/settings/ui/settings-section";
import { WhatsAppNotificationRow } from "@/features/settings/ui/whatsapp-notification-row";

const GROUPS = ["customer", "desk", "driver", "partner"] as const;

export function WhatsAppRegistryList({
  events,
  onEdit,
  onChanged,
}: {
  events: RegistryEventRow[];
  onEdit: (row: RegistryEventRow) => void;
  onChanged: () => void;
}) {
  const t = useTranslations("Dashboard.Settings");

  return (
    <>
      {GROUPS.map((audience) => {
        const rows = events.filter((row) => row.audience === audience);
        if (rows.length === 0) return null;
        return (
          <SettingsSection
            key={audience}
            title={t(`notify_group_${audience}`)}
            description={t(`notify_group_${audience}_help`)}
          >
            <ul className="flex flex-col gap-2">
              {rows.map((row) => (
                <WhatsAppNotificationRow
                  key={`${row.key}-${row.audience}`}
                  row={row}
                  onEdit={onEdit}
                  onChanged={onChanged}
                />
              ))}
            </ul>
          </SettingsSection>
        );
      })}
    </>
  );
}

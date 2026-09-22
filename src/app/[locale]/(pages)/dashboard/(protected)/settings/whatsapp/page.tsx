import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { SettingsPageWhatsapp } from "@/features/settings/ui/settings-page-whatsapp";

export default async function SettingsWhatsappRoute() {
  const t = await getTranslations("Dashboard.Settings");
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">{t("loading")}</p>}>
      <SettingsPageWhatsapp />
    </Suspense>
  );
}

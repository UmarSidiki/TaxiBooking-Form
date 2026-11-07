import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { AlertCircle } from "lucide-react";

import { getThemeSettings } from "@/features/settings/lib/theme-settings";
import "@/shared/style/embeddable-layout.css";

/** Embeds read the operator's palette tokens (riviera-palettes.css) from the first paint. */
export default async function EmbeddableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const settings = await getThemeSettings();

  if (settings.enableEmbeddableForm === false) {
    const t = await getTranslations("embeddable");
    return (
      <div className="riviera-embed flex min-h-64 items-center justify-center p-8">
        <div className="max-w-md space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">{t("disabled-title")}</p>
            <p className="text-sm text-muted-foreground">{t("disabled-message")}</p>
          </div>
        </div>
      </div>
    );
  }

  return <div className="riviera-embed">{children}</div>;
}

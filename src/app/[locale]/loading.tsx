import { getTranslations } from "next-intl/server";

/** Streams first, so it paints in the saved palette (data-palette is already on <html>). */
export default async function LocaleLoading() {
  const t = await getTranslations("AppError");
  return (
    <div className="riviera riviera-loading flex items-center justify-center p-6 text-sm text-muted-foreground" role="status">
      {t("loading")}
    </div>
  );
}

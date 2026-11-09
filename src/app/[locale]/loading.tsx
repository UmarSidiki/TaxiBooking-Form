import { getTranslations } from "next-intl/server";

/** Streams first, so it paints in the saved palette (data-palette is already on <html>). */
export default async function LocaleLoading() {
  const t = await getTranslations("AppError");
  return (
    <div
      className="riviera no-map riviera-loading flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-sm text-muted-foreground"
      role="status"
      aria-busy="true"
    >
      <span className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary motion-reduce:animate-none" aria-hidden="true" />
      <span>{t("loading")}</span>
    </div>
  );
}

import { getTranslations } from "next-intl/server";

export default async function LocaleLoading() {
  const t = await getTranslations("AppError");
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
      {t("loading")}
    </div>
  );
}

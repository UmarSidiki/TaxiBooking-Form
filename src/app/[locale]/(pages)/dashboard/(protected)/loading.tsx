import { getTranslations } from "next-intl/server";

export default async function DeskLoading() {
  const t = await getTranslations("AppError");
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      {t("loading")}
    </div>
  );
}

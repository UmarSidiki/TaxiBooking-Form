import { getTranslations } from "next-intl/server";
import { AppNotFoundScreen } from "@/shared/chrome/app-not-found-screen";

export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");
  return (
    <AppNotFoundScreen
      title={t("title")}
      description={t("description")}
      homeLabel={t("home")}
      homeHref="/"
    />
  );
}

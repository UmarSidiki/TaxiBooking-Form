import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <>
      <div className="flex justify-center items-center p-4">
        <h1>{t("title")}</h1>
        <LanguageSwitcher />
      </div>
    </>
  );
}

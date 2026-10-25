import { AdminToday } from "@/features/dashboard/ui/admin-today";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { getTranslations } from "next-intl/server";

export default async function AdminTodayPage() {
  const t = await getTranslations("Today");
  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta title={t("title")} description={t("description")} />
      <AdminToday />
    </div>
  );
}

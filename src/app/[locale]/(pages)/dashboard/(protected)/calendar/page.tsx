import { CalendarBoard } from "@/features/calendar/ui/calendar-board";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { getTranslations } from "next-intl/server";

export default async function AdminCalendarPage() {
  const t = await getTranslations("Calendar");
  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta title={t("title")} description={t("admin-description")} />
      <CalendarBoard />
    </div>
  );
}

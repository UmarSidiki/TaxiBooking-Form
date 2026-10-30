import { useTranslations } from "next-intl";
import { StatusMark } from "@/features/dashboard/ui/riviera/status-mark";

export function RidePaymentStatusBadge({ status }: { status: string }) {
  const t = useTranslations();

  switch (status) {
    case "completed":
      return <StatusMark tone="ok" label={t("Dashboard.Rides.Paid")} />;
    case "pending":
      return <StatusMark tone="info" label={t("Dashboard.Rides.Pending")} />;
    case "refunded":
      return <StatusMark tone="ok" label={t("Dashboard.Rides.Refunded")} />;
    case "failed":
      return <StatusMark tone="err" label={t("Dashboard.Rides.Failed")} />;
    default:
      return <StatusMark tone="muted" label={status} />;
  }
}
import { CampaignReportPage } from "@/features/marketing/ui/campaign-report-page";

export default async function CampaignReportRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CampaignReportPage id={id} />;
}

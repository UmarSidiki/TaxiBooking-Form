import { BrandLayout } from "@/features/emails/ui/brand-layout";
import { DetailList } from "@/features/emails/ui/detail-list";
import { PriceTable } from "@/features/emails/ui/price-table";
import { StatusBadge } from "@/features/emails/ui/status-badge";
import { TripCard } from "@/features/emails/ui/trip-card";
import type {
  EmailBrand,
  EmailDetail,
  EmailPriceRow,
  EmailTranslator,
  EmailTrip,
} from "@/features/emails/types";

export function CancellationEmail({
  t,
  brand,
  locale,
  subject,
  intro,
  trip,
  priceRows,
  details,
  manageUrl,
}: {
  t: EmailTranslator;
  brand: EmailBrand;
  locale: string;
  subject: string;
  intro: string;
  trip: EmailTrip;
  priceRows: EmailPriceRow[];
  details?: EmailDetail[];
  manageUrl?: string | null;
}) {
  return (
    <BrandLayout
      brand={brand}
      locale={locale}
      preheader={intro}
      heading={subject}
      intro={intro}
      t={t}
      manageUrl={manageUrl}
    >
      <StatusBadge label={t("status_cancelled")} tone="danger" />
      <TripCard trip={trip} t={t} />
      {details?.length ? <DetailList rows={details} /> : null}
      <PriceTable rows={priceRows} t={t} />
    </BrandLayout>
  );
}

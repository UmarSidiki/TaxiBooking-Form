import { BrandLayout } from "@/features/emails/ui/brand-layout";
import { CTA } from "@/features/emails/ui/cta";
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
  StatusTone,
} from "@/features/emails/types";

export function AssigneeEmail({
  t,
  brand,
  locale,
  subject,
  intro,
  trip,
  status,
  details,
  priceRows,
  cta,
}: {
  t: EmailTranslator;
  brand: EmailBrand;
  locale: string;
  subject: string;
  intro: string;
  trip: EmailTrip;
  status: { label: string; tone: StatusTone };
  details?: EmailDetail[];
  priceRows?: EmailPriceRow[];
  cta?: { url?: string | null; label: string } | null;
}) {
  return (
    <BrandLayout
      brand={brand}
      locale={locale}
      preheader={intro}
      heading={subject}
      intro={intro}
      t={t}
    >
      <StatusBadge label={status.label} tone={status.tone} />
      <TripCard trip={trip} t={t} />
      {details?.length ? <DetailList rows={details} /> : null}
      {priceRows?.length ? <PriceTable rows={priceRows} t={t} /> : null}
      {cta?.url ? (
        <CTA href={cta.url} label={cta.label} t={t} color={brand.primaryColor} />
      ) : null}
    </BrandLayout>
  );
}

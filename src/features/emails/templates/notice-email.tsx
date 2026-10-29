import type { ReactNode } from "react";
import { Text } from "@react-email/components";
import { BrandLayout } from "@/features/emails/ui/brand-layout";
import { CTA } from "@/features/emails/ui/cta";
import { DetailList } from "@/features/emails/ui/detail-list";
import { PriceTable } from "@/features/emails/ui/price-table";
import { StatusBadge } from "@/features/emails/ui/status-badge";
import { TripCard } from "@/features/emails/ui/trip-card";
import { emailTokens } from "@/features/emails/ui/tokens";
import type {
  EmailBrand,
  EmailDetail,
  EmailPriceRow,
  EmailTranslator,
  EmailTrip,
  StatusTone,
} from "@/features/emails/types";

export type NoticeEmailProps = {
  t: EmailTranslator;
  brand: EmailBrand;
  locale: string;
  subject: string;
  intro: string;
  manageUrl?: string | null;
  status?: { label: string; tone: StatusTone } | null;
  trip?: EmailTrip | null;
  priceRows?: EmailPriceRow[];
  details?: EmailDetail[];
  detailsTitle?: string;
  message?: string | null;
  cta?: { url?: string | null; label: string } | null;
  extra?: ReactNode;
};

export function NoticeEmail({
  t,
  brand,
  locale,
  subject,
  intro,
  manageUrl,
  status,
  trip,
  priceRows,
  details,
  detailsTitle,
  message,
  cta,
  extra,
}: NoticeEmailProps) {
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
      {status ? <StatusBadge label={status.label} tone={status.tone} /> : null}
      {trip ? <TripCard trip={trip} t={t} /> : null}
      {priceRows?.length ? <PriceTable rows={priceRows} t={t} /> : null}
      {details?.length ? <DetailList rows={details} title={detailsTitle} /> : null}
      {message ? (
        <Text
          style={{
            margin: "0 0 16px",
            fontFamily: emailTokens.font,
            fontSize: 16,
            lineHeight: "24px",
            color: emailTokens.text,
            whiteSpace: "pre-line",
          }}
        >
          {message}
        </Text>
      ) : null}
      {extra}
      {cta?.url ? (
        <CTA
          href={cta.url}
          label={cta.label}
          t={t}
          color={brand.primaryColor}
        />
      ) : null}
    </BrandLayout>
  );
}

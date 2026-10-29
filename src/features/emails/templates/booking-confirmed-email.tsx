import { Text } from "@react-email/components";
import { BrandLayout } from "@/features/emails/ui/brand-layout";
import { CTA } from "@/features/emails/ui/cta";
import { PriceTable } from "@/features/emails/ui/price-table";
import { StatusBadge } from "@/features/emails/ui/status-badge";
import { TripCard } from "@/features/emails/ui/trip-card";
import { emailTokens } from "@/features/emails/ui/tokens";
import type {
  EmailBrand,
  EmailPriceRow,
  EmailTranslator,
  EmailTrip,
} from "@/features/emails/types";

export function BookingConfirmedEmail({
  t,
  brand,
  locale,
  subject,
  intro,
  trip,
  priceRows,
  manageUrl,
  invoiceUrl,
  invoiceAttached,
  notes,
}: {
  t: EmailTranslator;
  brand: EmailBrand;
  locale: string;
  subject: string;
  intro: string;
  trip: EmailTrip;
  priceRows: EmailPriceRow[];
  manageUrl?: string | null;
  invoiceUrl?: string | null;
  invoiceAttached?: boolean;
  notes?: string | null;
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
      <StatusBadge label={t("status_confirmed")} tone="success" />
      <TripCard trip={trip} t={t} />
      <PriceTable rows={priceRows} t={t} />
      {notes ? (
        <Text
          style={{
            margin: "0 0 16px",
            fontFamily: emailTokens.font,
            fontSize: 15,
            lineHeight: "23px",
            color: emailTokens.muted,
            whiteSpace: "pre-line",
          }}
        >
          {notes}
        </Text>
      ) : null}
      {invoiceAttached ? (
        <Text
          style={{
            margin: "0 0 8px",
            fontFamily: emailTokens.font,
            fontSize: 15,
            lineHeight: "23px",
            color: emailTokens.muted,
          }}
        >
          {t("invoice")} PDF
        </Text>
      ) : null}
      {invoiceUrl ? (
        <CTA
          href={invoiceUrl}
          label={t("view_invoice")}
          t={t}
          color={brand.primaryColor}
        />
      ) : null}
    </BrandLayout>
  );
}

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

export type RequestVariant = "received" | "declined" | "quote";

const STATUS: Record<
  RequestVariant,
  { tone: "warning" | "danger" | "info"; key: string }
> = {
  received: { tone: "warning", key: "status_pending" },
  declined: { tone: "danger", key: "status_declined" },
  quote: { tone: "info", key: "status_confirmed" },
};

export function RequestEmail({
  variant,
  t,
  brand,
  locale,
  subject,
  intro,
  trip,
  priceRows,
  note,
  payUrl,
  payLabel,
  manageUrl,
}: {
  variant: RequestVariant;
  t: EmailTranslator;
  brand: EmailBrand;
  locale: string;
  subject: string;
  intro: string;
  trip: EmailTrip;
  priceRows?: EmailPriceRow[];
  note?: string | null;
  payUrl?: string | null;
  payLabel?: string;
  manageUrl?: string | null;
}) {
  const status = STATUS[variant];
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
      <StatusBadge label={t(status.key)} tone={status.tone} />
      <TripCard trip={trip} t={t} />
      {priceRows?.length ? <PriceTable rows={priceRows} t={t} /> : null}
      {note ? (
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
          {note}
        </Text>
      ) : null}
      {payUrl ? (
        <CTA
          href={payUrl}
          label={payLabel ?? t("status_confirmed")}
          t={t}
          color={brand.primaryColor}
        />
      ) : null}
    </BrandLayout>
  );
}

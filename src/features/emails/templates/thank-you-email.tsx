import { BrandLayout } from "@/features/emails/ui/brand-layout";
import { CTA } from "@/features/emails/ui/cta";
import { TripCard } from "@/features/emails/ui/trip-card";
import type {
  EmailBrand,
  EmailTranslator,
  EmailTrip,
} from "@/features/emails/types";

export function ThankYouEmail({
  t,
  brand,
  locale,
  subject,
  intro,
  trip,
  reviewUrl,
  manageUrl,
}: {
  t: EmailTranslator;
  brand: EmailBrand;
  locale: string;
  subject: string;
  intro: string;
  trip: EmailTrip;
  reviewUrl?: string | null;
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
      <TripCard trip={trip} t={t} />
      {reviewUrl ? (
        <CTA
          href={reviewUrl}
          label={t("review_cta")}
          t={t}
          color={brand.primaryColor}
        />
      ) : null}
    </BrandLayout>
  );
}

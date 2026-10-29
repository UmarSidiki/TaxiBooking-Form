import { Section, Text } from "@react-email/components";
import { BrandLayout } from "@/features/emails/ui/brand-layout";
import { emailTokens } from "@/features/emails/ui/tokens";
import type { EmailBrand, EmailTranslator } from "@/features/emails/types";

export function OtpEmail({
  t,
  brand,
  locale,
  subject,
  intro,
  code,
}: {
  t: EmailTranslator;
  brand: EmailBrand;
  locale: string;
  subject: string;
  intro: string;
  code: string;
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
      <Section
        style={{
          margin: "0 0 18px",
          padding: "20px 16px",
          textAlign: "center",
          backgroundColor: emailTokens.subtle,
          border: `1px solid ${emailTokens.border}`,
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            margin: "0 0 8px",
            fontFamily: emailTokens.font,
            fontSize: 13,
            lineHeight: "18px",
            color: emailTokens.muted,
          }}
        >
          {t("otp_expiry")}
        </Text>
        <Text
          style={{
            margin: 0,
            fontFamily: "Courier New, Courier, monospace",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: "8px",
            lineHeight: "42px",
            color: brand.primaryColor,
          }}
        >
          {code}
        </Text>
      </Section>
      <Text
        style={{
          margin: "0 0 8px",
          fontFamily: emailTokens.font,
          fontSize: 15,
          lineHeight: "23px",
          color: emailTokens.text,
        }}
      >
        {t("otp_security")}
      </Text>
      <Text
        style={{
          margin: 0,
          fontFamily: emailTokens.font,
          fontSize: 14,
          lineHeight: "22px",
          color: emailTokens.muted,
        }}
      >
        {t("otp_ignore")}
      </Text>
    </BrandLayout>
  );
}

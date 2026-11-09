import { Link, Section, Text } from "@react-email/components";
import { BrandLayout } from "@/features/emails/ui/brand-layout";
import { emailTokens } from "@/features/emails/ui/tokens";
import type { EmailBrand, EmailTranslator } from "@/features/emails/types";

function otpDigits(code: string) {
  return Array.from(code.trim());
}

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
        <table
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          style={{ margin: "0 auto", borderCollapse: "separate", borderSpacing: 6 }}
        >
          <tr>
            {otpDigits(code).map((digit, index) => (
              <td
                key={index}
                style={{
                  width: 44,
                  height: 52,
                  textAlign: "center",
                  verticalAlign: "middle",
                  backgroundColor: emailTokens.card,
                  border: `1px solid ${emailTokens.border}`,
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "Courier New, Courier, monospace",
                    fontSize: 28,
                    fontWeight: 700,
                    lineHeight: "52px",
                    color: brand.accent,
                  }}
                >
                  {digit}
                </span>
              </td>
            ))}
          </tr>
        </table>
        <Text
          style={{
            margin: "12px 0 0",
            fontFamily: emailTokens.font,
            fontSize: 13,
            lineHeight: "18px",
            color: emailTokens.muted,
          }}
        >
          {t("otp_copy_hint")} —{" "}
          <Link
            href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${subject}\n\n${code.trim()}`)}`}
            style={{
              fontFamily: emailTokens.font,
              fontSize: 13,
              fontWeight: 700,
              color: brand.accent,
              textDecoration: "underline",
            }}
          >
            {t("otp_copy_cta")}
          </Link>
          {"  ·  "}
          <code
            style={{
              fontFamily: "Courier New, Courier, monospace",
              fontSize: 14,
              color: emailTokens.text,
            }}
          >
            {code.trim()}
          </code>
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

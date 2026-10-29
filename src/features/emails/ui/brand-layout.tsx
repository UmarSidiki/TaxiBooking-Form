import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailDir } from "@/features/emails/lib/email-messages";
import type { EmailBrand, EmailTranslator } from "@/features/emails/types";
import { emailTokens } from "@/features/emails/ui/tokens";

export function BrandLayout({
  brand,
  locale,
  preheader,
  heading,
  intro,
  t,
  manageUrl,
  children,
}: {
  brand: EmailBrand;
  locale: string;
  preheader: string;
  heading: string;
  intro?: string | null;
  t: EmailTranslator;
  manageUrl?: string | null;
  children?: ReactNode;
}) {
  const year = new Date().getFullYear();
  return (
    <Html lang={locale} dir={emailDir(locale)}>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Preview>{preheader}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "24px 12px",
          backgroundColor: emailTokens.page,
          fontFamily: emailTokens.font,
          fontSize: 16,
          lineHeight: "24px",
          color: emailTokens.text,
          colorScheme: "light dark",
        }}
      >
        <Container
          style={{
            width: "100%",
            maxWidth: emailTokens.maxWidth,
            margin: "0 auto",
            backgroundColor: emailTokens.card,
            border: `1px solid ${emailTokens.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <Section style={{ padding: "20px 24px", borderBottom: `1px solid ${emailTokens.border}` }}>
            {brand.logoUrl ? (
              <Img
                src={brand.logoUrl}
                alt={brand.name}
                height={36}
                style={{ height: 36, width: "auto", maxWidth: "100%" }}
              />
            ) : (
              <Text
                style={{
                  margin: 0,
                  fontFamily: emailTokens.font,
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: "24px",
                  color: brand.primaryColor,
                }}
              >
                {brand.name}
              </Text>
            )}
          </Section>

          <Section style={{ padding: "24px" }}>
            <Heading
              as="h1"
              style={{
                margin: "0 0 12px",
                fontFamily: emailTokens.font,
                fontSize: 22,
                fontWeight: 700,
                lineHeight: "28px",
                color: emailTokens.text,
              }}
            >
              {heading}
            </Heading>
            {intro ? (
              <Text
                style={{
                  margin: "0 0 18px",
                  fontFamily: emailTokens.font,
                  fontSize: 16,
                  lineHeight: "24px",
                  color: emailTokens.text,
                }}
              >
                {intro}
              </Text>
            ) : null}
            {children}
          </Section>

          <Hr style={{ margin: 0, borderColor: emailTokens.border }} />

          <Section style={{ padding: "18px 24px 24px" }}>
            <Text
              style={{
                margin: "0 0 4px",
                fontFamily: emailTokens.font,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: "20px",
                color: emailTokens.text,
              }}
            >
              {brand.name}
            </Text>
            {brand.address ? (
              <Text
                style={{
                  margin: "0 0 2px",
                  fontFamily: emailTokens.font,
                  fontSize: 13,
                  lineHeight: "19px",
                  color: emailTokens.muted,
                }}
              >
                {brand.address}
              </Text>
            ) : null}
            {brand.phone ? (
              <Text
                style={{
                  margin: "0 0 2px",
                  fontFamily: emailTokens.font,
                  fontSize: 13,
                  lineHeight: "19px",
                  color: emailTokens.muted,
                }}
              >
                {brand.phone}
              </Text>
            ) : null}
            {brand.supportEmail ? (
              <Text
                style={{
                  margin: "0 0 10px",
                  fontFamily: emailTokens.font,
                  fontSize: 13,
                  lineHeight: "19px",
                  color: emailTokens.muted,
                }}
              >
                {t("footer_contact", { email: brand.supportEmail })}
              </Text>
            ) : null}
            {manageUrl ? (
              <Text style={{ margin: "0 0 10px" }}>
                <Link
                  href={manageUrl}
                  style={{
                    fontFamily: emailTokens.font,
                    fontSize: 14,
                    fontWeight: 700,
                    color: brand.primaryColor,
                    textDecoration: "underline",
                  }}
                >
                  {t("manage_booking")}
                </Link>
              </Text>
            ) : null}
            <Text
              style={{
                margin: "0 0 2px",
                fontFamily: emailTokens.font,
                fontSize: 12,
                lineHeight: "18px",
                color: emailTokens.muted,
              }}
            >
              {t("footer_automated")}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: emailTokens.font,
                fontSize: 12,
                lineHeight: "18px",
                color: emailTokens.muted,
              }}
            >
              © {year} {brand.name}. {t("footer_rights")}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

import { Link, Section, Text } from "@react-email/components";
import type { EmailTranslator } from "@/features/emails/types";
import { emailTokens } from "@/features/emails/ui/tokens";

export function CTA({
  href,
  label,
  t,
  color,
}: {
  href: string;
  label: string;
  t: EmailTranslator;
  color: string;
}) {
  return (
    <Section style={{ margin: "8px 0 18px" }}>
      <table role="presentation" cellPadding="0" cellSpacing="0" border={0}>
        <tbody>
          <tr>
            <td align="center" style={{ backgroundColor: color, borderRadius: 8 }}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  fontFamily: emailTokens.font,
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: "20px",
                  color: "#ffffff",
                  textDecoration: "none",
                  borderRadius: 8,
                  msoPaddingAlt: "0px 24px",
                }}
              >
                {label}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      <Text
        style={{
          margin: "12px 0 2px",
          fontFamily: emailTokens.font,
          fontSize: 12,
          lineHeight: "18px",
          color: emailTokens.muted,
        }}
      >
        {t("view_online")}
      </Text>
      <Link
        href={href}
        style={{
          fontFamily: emailTokens.font,
          fontSize: 12,
          lineHeight: "18px",
          color: color,
          wordBreak: "break-all",
        }}
      >
        {href}
      </Link>
    </Section>
  );
}

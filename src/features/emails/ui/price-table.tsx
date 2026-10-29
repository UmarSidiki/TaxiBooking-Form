import { Section, Text } from "@react-email/components";
import type { EmailPriceRow, EmailTranslator } from "@/features/emails/types";
import { emailTokens } from "@/features/emails/ui/tokens";

export function PriceTable({
  rows,
  t,
  title,
}: {
  rows: EmailPriceRow[];
  t: EmailTranslator;
  title?: string;
}) {
  const visible = rows.filter((row) => row.value.trim().length > 0);
  if (visible.length === 0) return null;
  return (
    <Section
      style={{
        margin: "0 0 18px",
        padding: "16px",
        border: `1px solid ${emailTokens.border}`,
        borderRadius: 8,
      }}
    >
      <Text
        style={{
          margin: "0 0 8px",
          fontFamily: emailTokens.font,
          fontSize: 16,
          fontWeight: 700,
          lineHeight: "22px",
          color: emailTokens.text,
        }}
      >
        {title ?? t("payment")}
      </Text>
      <table
        role="presentation"
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          {visible.map((row, index) => {
            const last = index === visible.length - 1;
            return (
              <tr key={`${row.label}-${index}`}>
                <td
                  style={{
                    padding: "6px 12px 6px 0",
                    fontFamily: emailTokens.font,
                    fontSize: last ? 16 : 14,
                    fontWeight: last ? 700 : 400,
                    lineHeight: "22px",
                    color: last ? emailTokens.text : emailTokens.muted,
                  }}
                >
                  {row.label}
                </td>
                <td
                  align="right"
                  style={{
                    padding: "6px 0",
                    fontFamily: emailTokens.font,
                    fontSize: last ? 18 : 14,
                    fontWeight: last ? 700 : 400,
                    lineHeight: "24px",
                    color: emailTokens.text,
                  }}
                >
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Section>
  );
}

import { Section, Text } from "@react-email/components";
import type { EmailDetail } from "@/features/emails/types";
import { emailTokens } from "@/features/emails/ui/tokens";

export function DetailList({
  rows,
  title,
}: {
  rows: EmailDetail[];
  title?: string;
}) {
  const visible = rows.filter((row) => row.value.trim().length > 0);
  if (visible.length === 0) return null;
  return (
    <Section style={{ margin: "0 0 18px" }}>
      {title ? (
        <Text
          style={{
            margin: "0 0 8px",
            fontFamily: emailTokens.font,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: emailTokens.muted,
          }}
        >
          {title}
        </Text>
      ) : null}
      <table
        role="presentation"
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          {visible.map((row, index) => (
            <tr key={`${row.label}-${index}`}>
              <td
                style={{
                  width: "38%",
                  padding: "8px 12px 8px 0",
                  borderTop: index > 0 ? `1px solid ${emailTokens.border}` : undefined,
                  verticalAlign: "top",
                  fontFamily: emailTokens.font,
                  fontSize: 14,
                  lineHeight: "20px",
                  color: emailTokens.muted,
                }}
              >
                {row.label}
              </td>
              <td
                style={{
                  padding: "8px 0",
                  borderTop: index > 0 ? `1px solid ${emailTokens.border}` : undefined,
                  verticalAlign: "top",
                  fontFamily: emailTokens.font,
                  fontSize: 16,
                  lineHeight: "22px",
                  color: emailTokens.text,
                }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

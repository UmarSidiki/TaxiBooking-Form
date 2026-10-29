import { Section, Text } from "@react-email/components";
import type { StatusTone } from "@/features/emails/types";
import { emailTokens, statusColors } from "@/features/emails/ui/tokens";

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusTone;
}) {
  const colors = statusColors(tone);
  return (
    <Section style={{ margin: "0 0 16px" }}>
      <table role="presentation" cellPadding="0" cellSpacing="0" border={0}>
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 999,
                padding: "4px 12px",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: emailTokens.font,
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: "16px",
                  color: colors.fg,
                }}
              >
                {label}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

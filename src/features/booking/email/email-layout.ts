import { escapeHtml } from "@/shared/lib/escape-html";

export type EmailDetail = [label: string, value: string];

const FONT = "Arial,Helvetica,sans-serif";
const ROW_BORDER = "border-top:1px solid #eceef1;";

/**
 * Label/value rows. Every value is escaped here, so callers pass raw strings
 * and must not pre-escape (that would double-encode).
 */
export function emailDetails(rows: EmailDetail[]): string {
  const body = rows
    .map(
      ([label, value], index) => `<tr>
        <td style="padding:8px 12px 8px 0;${
          index > 0 ? ROW_BORDER : ""
        }width:38%;color:#6b7280;vertical-align:top;font:13px/1.5 ${FONT};">${escapeHtml(
          label
        )}</td>
        <td style="padding:8px 0;${
          index > 0 ? ROW_BORDER : ""
        }color:#1f2328;vertical-align:top;font:13px/1.5 ${FONT};">${escapeHtml(
          value
        )}</td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;">${body}</table>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 14px;font:13px/1.6 ${FONT};color:#4b5563;">${escapeHtml(
    text
  )}</p>`;
}

export function emailSubheading(text: string): string {
  return `<h2 style="margin:18px 0 8px;font:600 13px/1.4 ${FONT};color:#1f2328;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(
    text
  )}</h2>`;
}

/**
 * Primary action plus the raw URL underneath, so the recipient can still reach
 * the page when the button is stripped or does not render.
 */
export function emailAction(url: string, label: string, color: string): string {
  if (!url) return "";

  const safeUrl = escapeHtml(url);
  const safeColor = escapeHtml(color);

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 12px;">
      <tr>
        <td style="background:${safeColor};border-radius:4px;">
          <a href="${safeUrl}" style="display:inline-block;padding:12px 22px;font:600 14px/1 ${FONT};color:#ffffff;text-decoration:none;">${escapeHtml(
            label
          )}</a>
        </td>
      </tr>
    </table>
  <p style="margin:0 0 2px;font:12px/1.5 ${FONT};color:#6b7280;">If the button does not work, paste this address into your browser:</p>
  <p style="margin:0 0 16px;font:12px/1.5 ${FONT};color:#6b7280;word-break:break-all;">${safeUrl}</p>`;
}

export function emailShell(options: {
  heading: string;
  primaryColor: string;
  intro?: string;
  sections?: string[];
  supportEmail?: string;
  footerNote?: string;
}): string {
  const {
    heading,
    primaryColor,
    intro = "",
    sections = [],
    supportEmail,
    footerNote,
  } = options;

  const siteName =
    process.env.NEXT_PUBLIC_WEBSITE_NAME || "Booking";
  const color = escapeHtml(primaryColor);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f4f5f7;font:14px/1.6 ${FONT};color:#1f2328;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e4e6ea;border-radius:6px;">
          <tr>
            <td style="padding:16px 24px;border-bottom:1px solid #e4e6ea;">
              <span style="font:600 15px/1.2 ${FONT};color:${color};">${escapeHtml(
                siteName
              )}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 24px;">
              <h1 style="margin:0 0 12px;font-size:17px;line-height:1.35;font-weight:600;color:#1f2328;">${escapeHtml(
                heading
              )}</h1>
              ${intro ? emailParagraph(intro) : ""}
              ${sections.join("\n")}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;border-top:1px solid #e4e6ea;font:12px/1.6 ${FONT};color:#6b7280;">
              <p style="margin:0;">${escapeHtml(siteName)}${
                supportEmail
                  ? ` &middot; <a href="mailto:${escapeHtml(
                      supportEmail
                    )}" style="color:${color};text-decoration:none;">${escapeHtml(
                      supportEmail
                    )}</a>`
                  : ""
              }</p>
              ${footerNote ? `<p style="margin:6px 0 0;">${escapeHtml(footerNote)}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

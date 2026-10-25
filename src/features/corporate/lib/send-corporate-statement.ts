import { corporateMonth } from "@/features/corporate/lib/monthly-statement";
import { renderStatementPdf } from "@/features/corporate/lib/render-statement-pdf";
import { statementCopy } from "@/features/corporate/lib/statement-labels";
import { sendEmail } from "@/features/settings/lib/email";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";

export async function sendCorporateStatement(accountId: string, month: string, locale = "en") {
  const statement = await corporateMonth(accountId, month);
  if (!statement) return { ok: false as const, error: "not_found" };
  const settings = await Setting.findOne().lean();
  const symbol = getCurrencySymbol(settings?.stripeCurrency?.toUpperCase() || "EUR");
  const company = settings?.smtpSenderName || "Booking";
  const pdf = await renderStatementPdf({
    companyName: company,
    accountName: statement.account.name,
    month,
    rows: statement.rows,
    total: statement.total,
    symbol,
    locale,
  });
  const copy = statementCopy(locale);
  const emailed = await sendEmail({
    to: statement.account.billingEmail,
    subject: `${copy.title} ${month}`,
    text: `${copy.title} ${month}: ${symbol}${statement.total.toFixed(2)}`,
    attachments: [{ filename: `statement-${month}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  return { ok: true as const, emailed, total: statement.total, pdf };
}

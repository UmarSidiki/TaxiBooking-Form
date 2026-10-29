import { corporateMonth } from "@/features/corporate/lib/monthly-statement";
import { renderStatementPdf } from "@/features/corporate/lib/render-statement-pdf";
import { statementCopy } from "@/features/corporate/lib/statement-labels";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";

export async function sendCorporateStatement(
  accountId: string,
  month: string,
  locale = "en",
) {
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

  const prepared = await prepareEventEmail({
    event: "corporate_statement",
    audience: "customer",
    locale,
    values: {
      name: statement.account.name,
      month,
      total: statement.total.toFixed(2),
    },
  });
  if (!prepared) {
    return { ok: true as const, emailed: false, total: statement.total, pdf };
  }

  const emailed = await sendPreparedEmail({
    prepared,
    to: statement.account.billingEmail,
    element: (
      <NoticeEmail
        t={prepared.t}
        brand={prepared.brand}
        locale={prepared.locale}
        subject={prepared.copy.subject}
        intro={prepared.copy.intro}
        status={{ label: prepared.t("status_confirmed"), tone: "info" }}
        details={[
          { label: prepared.t("name"), value: statement.account.name },
          { label: prepared.t("month"), value: month },
          { label: prepared.t("total"), value: `${symbol}${statement.total.toFixed(2)}` },
          { label: prepared.t("invoice"), value: copy.title },
        ]}
      />
    ),
    attachments: [
      {
        filename: `statement-${month}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });

  return { ok: true as const, emailed, total: statement.total, pdf };
}

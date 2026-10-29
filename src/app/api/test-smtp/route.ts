import { createElement } from "react";
import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { sendEmail } from "@/features/settings/lib/email";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { emailFrom } from "@/features/emails/lib/send-email";
import { emailTranslator } from "@/features/emails/lib/email-messages";
import { renderEmail } from "@/features/emails/lib/render-email";
import { loadEmailBrand } from "@/features/emails/lib/brand";
import { NoticeEmail } from "@/features/emails/templates/notice-email";

export async function POST() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  await connectDB();
  try {
    const settings = await Setting.findOne();
    const hasDatabaseConfig =
      settings && settings.smtpHost && settings.smtpUser;

    if (!hasDatabaseConfig) {
      return jsonError("smtp_not_configured", 400);
    }

    const smtpUser = settings.smtpUser;
    const testRecipient = settings.smtpTestEmail || smtpUser;
    const brand = await loadEmailBrand();
    const t = emailTranslator("en");
    const rendered = await renderEmail(
      createElement(NoticeEmail, {
        t,
        brand,
        locale: "en",
        subject: t("subject_smtp_test"),
        intro: t("intro_smtp_test"),
        status: { label: t("status_confirmed"), tone: "info" },
        message: t("smtp_test_time", { time: new Date().toISOString() }),
      }),
    );

    const success = await sendEmail({
      from: emailFrom(settings),
      to: testRecipient,
      subject: t("subject_smtp_test"),
      html: rendered.html,
      text: rendered.text,
    });

    if (!success) return jsonError("smtp_failed", 500);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SMTP test error:", error);
    return jsonError("smtp_failed", 500);
  }
}

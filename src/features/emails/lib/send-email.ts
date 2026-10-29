import { sendEmail } from "@/features/settings/lib/email";
import type { ISetting } from "@/features/settings/model";
import type { RenderedEmail } from "@/features/emails/lib/render-email";

export function emailFrom(settings: Partial<ISetting> | null): string {
  const address =
    settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
  return settings?.smtpSenderName
    ? `${settings.smtpSenderName} <${address}>`
    : address;
}

export type SendRenderedInput = {
  to: string | string[];
  subject: string;
  rendered: RenderedEmail;
  from: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

export async function sendRenderedEmail(input: SendRenderedInput) {
  return sendEmail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    html: input.rendered.html,
    text: input.rendered.text,
    attachments: input.attachments,
  });
}

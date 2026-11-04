import { sendEmail } from "@/features/settings/lib/email";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import type { ISetting } from "@/features/settings/model";
import { resolveMarketingSender } from "@/features/marketing/lib/email/marketing-sender";
import { buildListUnsubscribeHeaders } from "@/features/marketing/lib/unsubscribe/list-unsubscribe-headers";

export type MarketingEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  unsubscribeToken: string;
  locale: string;
  baseUrl?: string | null;
  settings?: Partial<ISetting> | null;
};

/**
 * Sends one marketing message through the existing transport, with the
 * marketing sender and the bulk-sender unsubscribe headers attached.
 * Callers must check eligibility first; this helper only transports.
 */
export async function sendMarketingEmail(
  input: MarketingEmailInput,
): Promise<boolean> {
  const [sender, resolvedBase] = await Promise.all([
    resolveMarketingSender(input.settings),
    input.baseUrl ? Promise.resolve(input.baseUrl) : resolvePublicUrl(),
  ]);
  if (!sender.from) return false;

  const baseUrl = (resolvedBase ?? "").trim();
  const headers =
    baseUrl && input.unsubscribeToken
      ? buildListUnsubscribeHeaders({
          baseUrl,
          token: input.unsubscribeToken,
          locale: input.locale,
        })
      : undefined;

  return sendEmail({
    from: sender.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: sender.replyTo,
    headers,
  });
}

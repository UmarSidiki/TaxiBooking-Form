import type { Address } from "nodemailer/lib/mailer";
import { Setting, type ISetting } from "@/features/settings/model";

export type MarketingSender = {
  from: string | Address | null;
  replyTo?: string;
};

/**
 * Marketing mail uses its own sender identity when configured, otherwise it
 * falls back to the transactional SMTP sender so a deployment still works.
 */
export async function resolveMarketingSender(
  settings?: Partial<ISetting> | null,
): Promise<MarketingSender> {
  const source =
    settings ??
    (await Setting.findOne()
      .select("marketingSenderName marketingSenderEmail marketingReplyTo smtpFrom smtpSenderName")
      .lean<Partial<ISetting> | null>());

  const address = (source?.marketingSenderEmail || source?.smtpFrom || "").trim();
  const name = (source?.marketingSenderName || source?.smtpSenderName || "").trim();
  const replyTo = (source?.marketingReplyTo || "").trim();

  return {
    from: address ? (name ? { name, address } : address) : null,
    replyTo: replyTo || undefined,
  };
}

import { WhatsAppConfig } from "@/features/settings/model";
import {
  sendWhatsAppTexts,
  type WhatsAppOutbound,
  type WhatsAppSendOptions,
} from "@/features/settings/lib/whatsapp-send";
import { toWhatsAppDigits, toWhatsAppJid } from "@/features/settings/lib/whatsapp-phone";
import { notify } from "@/features/notifications/notify";
import {
  whatsappBudgetMs,
  WHATSAPP_OTP_MAX_DURATION_SECONDS,
} from "@/features/settings/lib/whatsapp-deadline";

export const CUSTOMER_CODE_WHATSAPP_TIMEOUT_MS = whatsappBudgetMs(
  WHATSAPP_OTP_MAX_DURATION_SECONDS,
);

type SendFn = (
  messages: WhatsAppOutbound[],
  options?: WhatsAppSendOptions,
) => ReturnType<typeof sendWhatsAppTexts>;

export type DeliverCustomerCodeDeps = {
  send?: SendFn;
  timeoutMs?: number;
};

function withTimeout<T>(work: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("whatsapp_timeout")), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function resolveDigits(phone: string) {
  const config = await WhatsAppConfig.findOne()
    .select("defaultCallingCode")
    .lean<{ defaultCallingCode?: string }>();
  return toWhatsAppDigits(phone, config?.defaultCallingCode ?? "");
}

async function sendOnWhatsApp(phone: string, text: string, deps: DeliverCustomerCodeDeps) {
  const digits = await resolveDigits(phone);
  if (!digits) return false;
  try {
    const send = deps.send ?? sendWhatsAppTexts;
    const timeoutMs = deps.timeoutMs ?? CUSTOMER_CODE_WHATSAPP_TIMEOUT_MS;
    const result = await withTimeout(
      send([{ jid: toWhatsAppJid(digits), text }], { deadlineMs: timeoutMs, kind: "otp" }),
      timeoutMs + 1_000,
    );
    return result.ok && result.results.length > 0 && result.results.every((row) => row.ok);
  } catch {
    return false;
  }
}

/**
 * Deliver a sign-in code to a verified phone when possible, otherwise email.
 * Intentionally no reconnect or backoff here: the WhatsApp sender owns the
 * socket, and a login attempt must answer or fall back once. Never log the code.
 */
export async function deliverCustomerCode(
  input: { email: string; code: string; verifiedPhone?: string | null },
  deps: DeliverCustomerCodeDeps = {},
): Promise<"whatsapp" | "email"> {
  const phone = input.verifiedPhone?.trim();
  if (phone) {
    const text = `Your sign-in code is ${input.code}. It expires in 10 minutes.`;
    if (await sendOnWhatsApp(phone, text, deps)) return "whatsapp";
  }

  await notify("sign_in_otp", {
    variables: { code: input.code, ttlMinutes: "10" },
    channels: ["email"],
    recipients: { customer: [{ email: input.email }] },
  });
  return "email";
}

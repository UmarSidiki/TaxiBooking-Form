import { Driver } from "@/features/drivers/model";
import { Partner } from "@/features/partners/model";
import { Setting } from "@/features/settings/model";
import { readWhatsAppLinked } from "@/features/settings/lib/whatsapp-mongo-auth";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-session";
import {
  assignedText,
  availableText,
  cancelledText,
  changedText,
  phoneToJid,
  reminderText,
  settlementText,
  type RideNotice,
} from "@/features/settings/lib/assignee-whatsapp-text";

export type NoticeKind = "assigned" | "available" | "changed" | "cancelled" | "reminder" | "settlement";

export type NoticeRecipient = { phone?: string | null; name?: string };

type ToggleKey =
  | "whatsappTplAssigned"
  | "whatsappTplAvailable"
  | "whatsappTplChanged"
  | "whatsappTplReminder"
  | "whatsappTplSettlement";

const TOGGLE: Record<NoticeKind, ToggleKey> = {
  assigned: "whatsappTplAssigned",
  available: "whatsappTplAvailable",
  changed: "whatsappTplChanged",
  cancelled: "whatsappTplChanged",
  reminder: "whatsappTplReminder",
  settlement: "whatsappTplSettlement",
};

export type OutboundText = { jid: string; text: string };

export type WhatsAppSend = (messages: OutboundText[]) => Promise<{ ok: boolean }>;

function textFor(kind: NoticeKind, ride: RideNotice | undefined, amount?: number, currency?: string) {
  if (kind === "settlement") return settlementText(amount ?? 0, currency ?? "eur");
  if (!ride) return "";
  if (kind === "assigned") return assignedText(ride);
  if (kind === "available") return availableText(ride);
  if (kind === "changed") return changedText(ride);
  if (kind === "cancelled") return cancelledText(ride);
  return reminderText(ride);
}

export function messagesFor(kind: NoticeKind, recipients: NoticeRecipient[], ride?: RideNotice, amount?: number, currency?: string) {
  const text = textFor(kind, ride, amount, currency);
  const messages: OutboundText[] = [];
  for (const recipient of recipients) {
    if (!recipient.phone) continue;
    const jid = phoneToJid(recipient.phone);
    if (!jid) continue;
    messages.push({ jid, text });
  }
  return messages;
}

export async function deliverAssigneeNotice(input: {
  kind: NoticeKind;
  recipients: NoticeRecipient[];
  ride?: RideNotice;
  amount?: number;
  currency?: string;
}, deps?: { linked?: () => Promise<boolean>; send?: WhatsAppSend }) {
  const linked = deps?.linked ?? readWhatsAppLinked;
  const send = deps?.send ?? ((messages) => sendWhatsAppTexts(messages));
  try {
    const settings = await Setting.findOne().select(TOGGLE[input.kind]).lean();
    if (!settings?.[TOGGLE[input.kind]]) {
      console.info("WhatsApp skipped: toggle off", input.kind);
      return { sent: 0, reason: "toggle_off" as const };
    }
    if (!(await linked())) {
      console.info("WhatsApp skipped: session not linked", input.kind);
      return { sent: 0, reason: "not_linked" as const };
    }
    const messages = messagesFor(input.kind, input.recipients, input.ride, input.amount, input.currency);
    if (!messages.length) {
      console.info("WhatsApp skipped: no phone", input.kind);
      return { sent: 0, reason: "no_phone" as const };
    }
    const result = await send(messages);
    console.info("WhatsApp assignee notice", input.kind, messages.map((message) => message.jid), result.ok);
    return { sent: result.ok ? messages.length : 0, reason: result.ok ? "sent" as const : "failed" as const };
  } catch (error) {
    console.error("WhatsApp assignee notice failed:", input.kind, error);
    return { sent: 0, reason: "failed" as const };
  }
}

export function queueAssigneeNotice(input: Parameters<typeof deliverAssigneeNotice>[0]) {
  void deliverAssigneeNotice(input).catch((error) => {
    console.error("WhatsApp assignee notice failed:", error);
  });
}

export async function phonesForAssignees(input: {
  driverId?: string | null;
  partnerId?: string | null;
}) {
  const [driver, partner] = await Promise.all([
    input.driverId ? Driver.findById(input.driverId).select("phone name").lean() : null,
    input.partnerId ? Partner.findById(input.partnerId).select("phone name").lean() : null,
  ]);
  return {
    driver: driver ? { phone: driver.phone, name: driver.name } : undefined,
    partner: partner ? { phone: partner.phone, name: partner.name } : undefined,
  };
}

import { WhatsAppDelivery } from "@/features/settings/model";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-session";
import { readWhatsAppLinked } from "@/features/settings/lib/whatsapp-mongo-auth";
import { sendEmail } from "@/features/settings/lib/email";
import { notificationEvent } from "@/features/notifications/notification-events";
import {
  planNotifications,
  type PlannedEmail,
  type PlannedWhatsApp,
} from "@/features/notifications/lib/plan-notifications";
import type {
  NotificationContext,
  NotificationResult,
  NotificationSkipReason,
} from "@/features/notifications/notification-types";

export type NotificationDeps = {
  linked?: () => Promise<boolean>;
  send?: (
    messages: { jid: string; text: string; document?: { base64: string; fileName: string } }[],
  ) => Promise<{ ok: boolean; results?: { jid: string; ok: boolean }[] }>;
  sendMail?: (mail: PlannedEmail) => Promise<boolean>;
};

function isDuplicateKey(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

async function claimDeliveries(bookingId: string, messages: PlannedWhatsApp[]) {
  const claimed: PlannedWhatsApp[] = [];
  for (const message of messages) {
    if (message.audience !== "customer" && message.audience !== "desk") {
      claimed.push(message);
      continue;
    }
    try {
      await WhatsAppDelivery.create({
        bookingId,
        audience: message.audience,
        to: message.to,
        status: "sending",
      });
      claimed.push(message);
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
  }
  return claimed;
}

async function settleDeliveries(
  bookingId: string,
  messages: PlannedWhatsApp[],
  send: { ok: boolean; results?: { jid: string; ok: boolean }[] },
) {
  await Promise.all(
    messages
      .filter((message) => message.audience === "customer" || message.audience === "desk")
      .map((message) => {
        const perMessage = send.results?.find((item) => item.jid === message.jid);
        const ok = perMessage ? perMessage.ok : send.ok;
        return WhatsAppDelivery.updateOne(
          { bookingId, audience: message.audience, to: message.to },
          { $set: { status: ok ? "sent" : "failed" } },
        );
      }),
  );
}

export async function notify(
  eventKey: string,
  ctx: NotificationContext = {},
  deps: NotificationDeps = {},
): Promise<NotificationResult> {
  const definition = notificationEvent(eventKey);
  if (!definition) {
    return { ok: true, queued: 0, skipped: "unknown_event", deliveries: [] };
  }

  try {
    const plan = await planNotifications(definition, ctx);
    let whatsapp = plan.whatsapp;
    let skipped: NotificationSkipReason | null = null;

    if (whatsapp.length > 0) {
      const linked = deps.linked ?? readWhatsAppLinked;
      if (!(await linked())) {
        whatsapp = [];
        skipped = "not_linked";
      }
    }

    if (ctx.bookingId && whatsapp.length > 0) {
      whatsapp = await claimDeliveries(ctx.bookingId, whatsapp);
    }

    if (whatsapp.length === 0 && plan.email.length === 0) {
      const reason = skipped ?? (plan.quietHours ? "quiet_hours" : plan.disabled ? "disabled" : "no_recipients");
      return { ok: true, queued: 0, skipped: reason, deliveries: [] };
    }

    let ok = true;
    if (whatsapp.length > 0) {
      const send = deps.send ?? ((messages) => sendWhatsAppTexts(messages));
      const result = await send(whatsapp.map(({ jid, text, document }) => ({ jid, text, document })));
      ok = result.ok;
      if (ctx.bookingId) await settleDeliveries(ctx.bookingId, whatsapp, result);
    }

    if (plan.email.length > 0) {
      const sendMail = deps.sendMail ?? ((mail: PlannedEmail) => sendEmail(mail));
      const results = await Promise.all(plan.email.map((mail) => sendMail(mail)));
      ok = ok && results.every(Boolean);
    }

    return {
      ok,
      queued: whatsapp.length + plan.email.length,
      skipped: null,
      deliveries: [
        ...whatsapp.map((message) => ({ channel: "whatsapp" as const, audience: message.audience, to: message.to })),
        ...plan.email.map((mail) => ({ channel: "email" as const, audience: mail.audience, to: mail.to })),
      ],
    };
  } catch (error) {
    console.error("Notification failed:", eventKey, error);
    return { ok: false, queued: 0, skipped: null, deliveries: [] };
  }
}

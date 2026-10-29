import { Driver } from "@/features/drivers/model";
import { Partner } from "@/features/partners/model";
import { notify } from "@/features/notifications/notify";
import type { NotificationAudience } from "@/features/notifications/notification-types";

export type RideNotice = {
  tripId: string;
  pickup: string;
  date: string;
  time: string;
};

export type NoticeKind =
  | "assigned"
  | "available"
  | "changed"
  | "cancelled"
  | "reminder"
  | "settlement";

export type NoticeRecipient = {
  phone?: string | null;
  email?: string | null;
  name?: string;
  audience?: "driver" | "partner";
  whatsappOptIn?: boolean;
};

export type OutboundText = { jid: string; text: string };

export type WhatsAppSend = (messages: OutboundText[]) => Promise<{ ok: boolean }>;

const EVENT: Record<NoticeKind, string> = {
  assigned: "ride_assigned",
  available: "ride_available",
  changed: "ride_changed",
  cancelled: "ride_cancelled",
  reminder: "pickup_reminder",
  settlement: "partner_settlement",
};

const DEFAULT_AUDIENCE: Record<NoticeKind, "driver" | "partner"> = {
  assigned: "driver",
  available: "driver",
  changed: "driver",
  cancelled: "driver",
  reminder: "driver",
  settlement: "partner",
};

function groupRecipients(kind: NoticeKind, recipients: NoticeRecipient[]) {
  const groups: Partial<Record<NotificationAudience, NoticeRecipient[]>> = {};
  for (const recipient of recipients) {
    const audience = recipient.audience ?? DEFAULT_AUDIENCE[kind];
    (groups[audience] ??= []).push(recipient);
  }
  return groups;
}

function variablesFor(
  kind: NoticeKind,
  ride?: RideNotice,
  amount?: number,
  currency?: string,
) {
  if (kind === "settlement") {
    return {
      total: (amount ?? 0).toFixed(2),
      currency: (currency ?? "eur").toUpperCase(),
    };
  }
  if (!ride) return {};
  return {
    tripId: ride.tripId,
    pickup: ride.pickup,
    date: ride.date,
    time: ride.time,
  };
}

export async function deliverAssigneeNotice(input: {
  kind: NoticeKind;
  recipients: NoticeRecipient[];
  ride?: RideNotice;
  amount?: number;
  currency?: string;
}, deps?: { linked?: () => Promise<boolean>; send?: WhatsAppSend }) {
  try {
    const result = await notify(
      EVENT[input.kind],
      {
        variables: variablesFor(input.kind, input.ride, input.amount, input.currency),
        recipients: groupRecipients(input.kind, input.recipients),
      },
      { linked: deps?.linked, send: deps?.send },
    );

    if (result.skipped === "not_linked") {
      console.info("WhatsApp skipped: session not linked", input.kind);
      return { sent: 0, reason: "not_linked" as const };
    }
    if (result.skipped === "disabled") {
      console.info("WhatsApp skipped: toggle off", input.kind);
      return { sent: 0, reason: "toggle_off" as const };
    }
    if (!result.ok) return { sent: 0, reason: "failed" as const };
    if (result.queued === 0) {
      console.info("WhatsApp skipped: no phone", input.kind);
      return { sent: 0, reason: "no_phone" as const };
    }
    console.info("WhatsApp assignee notice", input.kind, result.deliveries.map((item) => item.to));
    return { sent: result.queued, reason: "sent" as const };
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
    driver: driver ? { phone: driver.phone, name: driver.name, audience: "driver" as const } : undefined,
    partner: partner ? { phone: partner.phone, name: partner.name, audience: "partner" as const } : undefined,
  };
}

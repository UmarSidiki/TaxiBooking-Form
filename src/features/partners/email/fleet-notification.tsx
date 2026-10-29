import { absoluteHttpBase, bookingMailLocale } from "@/features/booking/lib/booking-mail-url";
import { resolveAdminNotificationEmails } from "@/features/settings/lib/resolve-admin-emails";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";

interface FleetRequestData {
  partnerName: string;
  partnerEmail: string;
  vehicleName: string;
  vehicleCategory: string;
  baseUrl?: string;
}

interface FleetApprovalData {
  partnerName: string;
  partnerEmail: string;
  vehicleName: string;
  vehicleCategory: string;
  baseUrl?: string;
}

interface FleetRejectionData extends FleetApprovalData {
  rejectionReason?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function link(baseUrl: string | undefined, locale: string, path: string) {
  const base = absoluteHttpBase(baseUrl);
  if (!base) return null;
  return `${base}/${bookingMailLocale(locale)}/${path}`;
}

export async function sendFleetRequestNotificationEmail(data: FleetRequestData) {
  try {
    if (!isValidEmail(data.partnerEmail)) {
      console.error("Invalid partner email address:", data.partnerEmail);
      return false;
    }
    const prepared = await prepareEventEmail({
      event: "fleet_requested",
      audience: "desk",
      locale: "en",
      values: {
        partnerName: data.partnerName,
        partnerEmail: data.partnerEmail,
        vehicleName: data.vehicleName,
        vehicleCategory: data.vehicleCategory,
      },
    });
    if (!prepared) return false;

    const recipients = await resolveAdminNotificationEmails();
    const url = link(data.baseUrl, prepared.locale, "dashboard/partners");
    let anySuccess = false;
    for (const to of recipients) {
      const sent = await sendPreparedEmail({
        prepared,
        to,
        element: (
          <NoticeEmail
            t={prepared.t}
            brand={prepared.brand}
            locale={prepared.locale}
            subject={prepared.copy.subject}
            intro={prepared.copy.intro}
            status={{ label: prepared.t("status_pending"), tone: "warning" }}
            details={[
              { label: prepared.t("name"), value: data.partnerName },
              { label: prepared.t("email"), value: data.partnerEmail },
              { label: prepared.t("vehicle"), value: data.vehicleName },
              { label: prepared.t("status"), value: data.vehicleCategory },
            ]}
            cta={url ? { url, label: prepared.t("open_desk") } : null}
          />
        ),
        links: [url],
      });
      if (sent) anySuccess = true;
    }
    return anySuccess;
  } catch (error) {
    console.error("Error sending fleet request notification email:", error);
    return false;
  }
}

async function sendFleetDecision(input: {
  event: "fleet_approved" | "fleet_rejected";
  data: FleetRejectionData;
  statusKey: string;
  tone: "success" | "danger";
  ctaKey: string | null;
  path: string;
}) {
  if (!isValidEmail(input.data.partnerEmail)) {
    console.error("Invalid partner email address:", input.data.partnerEmail);
    return false;
  }
  const prepared = await prepareEventEmail({
    event: input.event,
    audience: "partner",
    locale: "en",
    values: {
      partnerName: input.data.partnerName,
      vehicleName: input.data.vehicleName,
      vehicleCategory: input.data.vehicleCategory,
      reason: input.data.rejectionReason ?? "",
    },
  });
  if (!prepared) return false;

  const url = input.ctaKey ? link(input.data.baseUrl, prepared.locale, input.path) : null;
  return sendPreparedEmail({
    prepared,
    to: input.data.partnerEmail,
    element: (
      <NoticeEmail
        t={prepared.t}
        brand={prepared.brand}
        locale={prepared.locale}
        subject={prepared.copy.subject}
        intro={prepared.copy.intro}
        status={{ label: prepared.t(input.statusKey), tone: input.tone }}
        details={[
          { label: prepared.t("name"), value: input.data.partnerName },
          { label: prepared.t("vehicle"), value: input.data.vehicleName },
          { label: prepared.t("status"), value: input.data.vehicleCategory },
        ]}
        message={input.data.rejectionReason?.trim() || null}
        cta={url && input.ctaKey ? { url, label: prepared.t(input.ctaKey) } : null}
      />
    ),
    links: [url],
  });
}

export async function sendFleetApprovalEmail(data: FleetApprovalData) {
  try {
    return await sendFleetDecision({
      event: "fleet_approved",
      data,
      statusKey: "status_approved",
      tone: "success",
      ctaKey: "partner_dashboard",
      path: "partners/dashboard",
    });
  } catch (error) {
    console.error("Error sending fleet approval email:", error);
    return false;
  }
}

export async function sendFleetRejectionEmail(data: FleetRejectionData) {
  try {
    return await sendFleetDecision({
      event: "fleet_rejected",
      data,
      statusKey: "status_rejected",
      tone: "danger",
      ctaKey: "submit_request",
      path: "partners/fleet",
    });
  } catch (error) {
    console.error("Error sending fleet rejection email:", error);
    return false;
  }
}

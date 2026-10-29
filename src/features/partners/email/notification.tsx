import { absoluteHttpBase, bookingMailLocale } from "@/features/booking/lib/booking-mail-url";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";
import type { EmailTrip } from "@/features/emails/types";

interface PartnerData {
  name: string;
  email: string;
  rejectionReason?: string;
  baseUrl?: string;
}

interface RideNotificationData {
  tripId: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  vehicleType: string;
  passengerCount: number;
  partnerName: string;
  partnerEmail: string;
  baseUrl?: string;
  partnerAmount?: number;
  currencySymbol?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function partnerUrl(baseUrl: string | undefined, locale: string, path: string) {
  const base = absoluteHttpBase(baseUrl);
  if (!base) return null;
  return `${base}/${bookingMailLocale(locale)}/${path}`;
}

async function sendPartnerNotice(input: {
  event: "partner_approved" | "partner_rejected" | "partner_suspended";
  data: PartnerData;
  statusKey: string;
  tone: "success" | "danger" | "warning";
  path: string;
  ctaKey: string | null;
  values: Record<string, string>;
}) {
  if (!isValidEmail(input.data.email)) {
    console.error("Invalid email address:", input.data.email);
    return false;
  }
  const prepared = await prepareEventEmail({
    event: input.event,
    audience: "partner",
    locale: "en",
    values: input.values,
  });
  if (!prepared) return false;

  const url = input.ctaKey
    ? partnerUrl(input.data.baseUrl, prepared.locale, input.path)
    : null;

  return sendPreparedEmail({
    prepared,
    to: input.data.email,
    element: (
      <NoticeEmail
        t={prepared.t}
        brand={prepared.brand}
        locale={prepared.locale}
        subject={prepared.copy.subject}
        intro={prepared.copy.intro}
        status={{ label: prepared.t(input.statusKey), tone: input.tone }}
        details={[{ label: prepared.t("name"), value: input.data.name }]}
        message={input.data.rejectionReason?.trim() || null}
        cta={url && input.ctaKey ? { url, label: prepared.t(input.ctaKey) } : null}
      />
    ),
    links: [url],
  });
}

export async function sendPartnerApprovalEmail(partnerData: PartnerData) {
  try {
    return await sendPartnerNotice({
      event: "partner_approved",
      data: partnerData,
      statusKey: "status_approved",
      tone: "success",
      path: "partners/dashboard",
      ctaKey: "partner_dashboard",
      values: { name: partnerData.name },
    });
  } catch (error) {
    console.error("Error sending partner approval email:", error);
    return false;
  }
}

export async function sendPartnerRejectionEmail(partnerData: PartnerData) {
  try {
    return await sendPartnerNotice({
      event: "partner_rejected",
      data: partnerData,
      statusKey: "status_rejected",
      tone: "danger",
      path: "contact",
      ctaKey: null,
      values: { name: partnerData.name, reason: partnerData.rejectionReason ?? "" },
    });
  } catch (error) {
    console.error("Error sending partner rejection email:", error);
    return false;
  }
}

export async function sendPartnerSuspensionEmail(partnerData: PartnerData) {
  try {
    return await sendPartnerNotice({
      event: "partner_suspended",
      data: partnerData,
      statusKey: "status_suspended",
      tone: "warning",
      path: "contact",
      ctaKey: null,
      values: { name: partnerData.name, reason: partnerData.rejectionReason ?? "" },
    });
  } catch (error) {
    console.error("Error sending partner suspension email:", error);
    return false;
  }
}

export async function sendRideNotificationEmail(data: RideNotificationData) {
  try {
    if (!isValidEmail(data.partnerEmail)) {
      console.error("Invalid email address:", data.partnerEmail);
      return false;
    }

    const prepared = await prepareEventEmail({
      event: "ride_available",
      audience: "partner",
      locale: "en",
      values: {
        tripId: data.tripId,
        pickup: data.pickup,
        date: data.date,
        time: data.time,
      },
    });
    if (!prepared) return false;

    const url = partnerUrl(data.baseUrl, prepared.locale, "partners/dashboard");
    const trip: EmailTrip = {
      tripId: data.tripId,
      pickup: data.pickup,
      dropoff: data.dropoff || null,
      date: data.date,
      time: data.time,
      vehicle: data.vehicleType,
      passengers: data.passengerCount,
    };

    return sendPreparedEmail({
      prepared,
      to: data.partnerEmail,
      element: (
        <NoticeEmail
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          status={{ label: prepared.t("status_available"), tone: "info" }}
          trip={trip}
          details={[{ label: prepared.t("name"), value: data.partnerName }]}
          priceRows={
            typeof data.partnerAmount === "number"
              ? [
                  {
                    label: prepared.t("your_earnings"),
                    value: `${data.currencySymbol ?? "€"}${data.partnerAmount.toFixed(2)}`,
                  },
                ]
              : []
          }
          cta={url ? { url, label: prepared.t("view_ride") } : null}
        />
      ),
      links: [url],
    });
  } catch (error) {
    console.error("Error sending ride notification email:", error);
    return false;
  }
}

import { absoluteHttpBase, bookingMailLocale } from "@/features/booking/lib/booking-mail-url";
import { resolveAdminNotificationEmails } from "@/features/settings/lib/resolve-admin-emails";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";

interface PartnerRegistrationData {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  baseUrl?: string;
}

export async function sendAdminPartnerRegistrationEmail(
  partnerData: PartnerRegistrationData,
) {
  try {
    const prepared = await prepareEventEmail({
      event: "partner_registered",
      audience: "desk",
      locale: "en",
      values: {
        name: partnerData.name,
        email: partnerData.email,
        phone: partnerData.phone ?? "",
        city: partnerData.city ?? "",
        country: partnerData.country ?? "",
      },
    });
    if (!prepared) return false;

    const recipients = await resolveAdminNotificationEmails();
    if (recipients.length === 0) return false;

    const base = absoluteHttpBase(partnerData.baseUrl);
    const url = base
      ? `${base}/${bookingMailLocale(prepared.locale)}/dashboard/partners`
      : null;

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
              { label: prepared.t("name"), value: partnerData.name },
              { label: prepared.t("email"), value: partnerData.email },
              { label: prepared.t("phone"), value: partnerData.phone ?? "" },
              { label: prepared.t("contact"), value: partnerData.city ?? "" },
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
    console.error("Error sending admin partner registration email:", error);
    return false;
  }
}

import { connectDB } from "@/shared/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";

function digitsOf(value: string | null | undefined): string {
  let digits = "";
  for (const char of value ?? "") {
    if (char >= "0" && char <= "9") digits += char;
  }
  return digits;
}

/** Best-effort: record a WhatsApp STOP reply as consent withdrawal + suppression. */
export async function handleWhatsAppStop(jid: string): Promise<void> {
  const digits = digitsOf(jid);
  if (!digits) return;
  await connectDB();
  const profiles = await CustomerProfile.find({ verifiedPhone: { $ne: "" } })
    .select("email verifiedPhone")
    .lean<Array<{ email: string; verifiedPhone?: string }>>();
  const match = profiles.find(
    (profile) => digitsOf(profile.verifiedPhone) === digits,
  );
  if (!match?.email) return;
  await applyMarketingConsent({
    email: match.email,
    channel: "whatsapp",
    status: "withdrawn",
    source: "whatsapp_stop",
    phoneDigits: digits,
  });
}
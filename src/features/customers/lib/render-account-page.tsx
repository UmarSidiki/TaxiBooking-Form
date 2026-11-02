import { connectDB } from "@/shared/db";
import { AccountDesk } from "@/features/customers/ui/account-desk";
import type {
  AccountRides,
  CancelPolicyTier,
  CustomerProfile,
} from "@/features/customers/ui/account-types";
import { legacyCustomerEmail } from "@/features/customers/lib/legacy-customer-token";
import { readCustomerSession } from "@/features/customers/lib/customer-session";
import { ridesForEmail } from "@/features/customers/lib/customer-rides";
import { greetingKeyInTimeZone } from "@/features/customers/lib/account-greeting";
import CustomerProfileModel from "@/features/customers/model/CustomerProfile";
import { Setting } from "@/features/settings/model";
import { brandName } from "@/features/settings/lib/brand-name";
import type { AccountSection } from "@/features/customers/lib/account-sections";

export type AccountSearchParams = { token?: string | string[]; link?: string | string[] };

type SettingsLean = {
  companyName?: string;
  smtpSenderName?: string;
  companyLogoUrl?: string;
  companyPhone?: string;
  stripeCurrency?: string;
  timezone?: string;
  cancelPolicy?: CancelPolicyTier[];
  enableMarketing?: boolean;
};

type ProfileLean = {
  name?: string;
  phone?: string;
  verifiedPhone?: string;
  language?: string;
  whatsappOptIn?: boolean;
  marketing?: {
    email?: { status?: "none" | "granted" | "withdrawn" } | null;
    whatsapp?: { status?: "none" | "granted" | "withdrawn" } | null;
  } | null;
  savedAddresses?: { home?: string; work?: string; airport?: string };
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toProfile(row: ProfileLean | null): CustomerProfile | null {
  if (!row) return null;
  return {
    name: row.name ?? "",
    phone: row.phone ?? "",
    verifiedPhone: row.verifiedPhone ?? "",
    language: row.language ?? "en",
    whatsappOptIn: row.whatsappOptIn ?? true,
    marketing: {
      email: { status: row.marketing?.email?.status ?? "none" },
      whatsapp: { status: row.marketing?.whatsapp?.status ?? "none" },
    },
    savedAddresses: {
      home: row.savedAddresses?.home ?? "",
      work: row.savedAddresses?.work ?? "",
      airport: row.savedAddresses?.airport ?? "",
    },
  };
}

export async function renderAccountPage(
  section: AccountSection,
  searchParams: Promise<AccountSearchParams>,
) {
  const params = await searchParams;
  const legacyToken = first(params.token);

  await connectDB();
  const session = await readCustomerSession();
  const [settings, rides, profileRow] = await Promise.all([
    Setting.findOne()
      .select(
        "companyName smtpSenderName companyLogoUrl companyPhone stripeCurrency timezone cancelPolicy enableMarketing",
      )
      .lean<SettingsLean | null>(),
    session ? ridesForEmail(session.email) : Promise.resolve(null),
    session
      ? CustomerProfileModel.findOne({ email: session.email }).lean<ProfileLean | null>()
      : Promise.resolve(null),
  ]);

  const initialRides: AccountRides | undefined = rides
    ? (JSON.parse(JSON.stringify(rides)) as AccountRides)
    : undefined;
  const timezone = settings?.timezone || "Europe/Zurich";

  return (
    <AccountDesk
      section={section}
      expiredLink={Boolean(legacyToken) || first(params.link) === "expired"}
      prefilledEmail={legacyToken ? legacyCustomerEmail(legacyToken) ?? "" : ""}
      brandName={brandName(settings)}
      logoUrl={settings?.companyLogoUrl?.trim() ?? ""}
      initialEmail={session?.email ?? ""}
      initialRides={initialRides}
      initialProfile={toProfile(profileRow)}
      initialGreeting={greetingKeyInTimeZone(new Date(), timezone)}
      currency={settings?.stripeCurrency || "EUR"}
      timezone={timezone}
      companyPhone={settings?.companyPhone ?? ""}
      cancelPolicy={settings?.cancelPolicy?.map(({ hoursBefore, feePercent }) => ({ hoursBefore, feePercent })) ?? null}
      marketingEnabled={settings?.enableMarketing !== false}
    />
  );
}

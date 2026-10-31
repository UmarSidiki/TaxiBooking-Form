import { connectDB } from "@/shared/db";
import { AccountDesk } from "@/features/customers/ui/account-desk";
import { legacyCustomerEmail } from "@/features/customers/lib/legacy-customer-token";
import { Setting } from "@/features/settings/model";
import { brandName } from "@/features/settings/lib/brand-name";

type Params = { token?: string | string[]; link?: string | string[] };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const legacyToken = first(params.token);

  await connectDB();
  const settings = await Setting.findOne()
    .select("companyName smtpSenderName companyLogoUrl")
    .lean<{
      companyName?: string;
      smtpSenderName?: string;
      companyLogoUrl?: string;
    }>();

  return (
    <AccountDesk
      expiredLink={Boolean(legacyToken) || first(params.link) === "expired"}
      prefilledEmail={legacyToken ? legacyCustomerEmail(legacyToken) ?? "" : ""}
      brandName={brandName(settings)}
      logoUrl={settings?.companyLogoUrl?.trim() ?? ""}
    />
  );
}
